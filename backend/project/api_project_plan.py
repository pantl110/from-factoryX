from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from django.db import models
from django.conf import settings
from datetime import datetime
from decimal import Decimal
import pytz
from project.schemas.inbound import (
    ProjectPlanCreateOrUpdateIn,
    ProjectPlanListFilter,
)
from project.schemas.outbound import (
    ProjectPlanDetailWithRelationsOut,
    ProductDetailOut,
    QuotationProductDetailOut,
    EquipmentDetailOut,
    DashboardOut,
    ProjectPlanCreateOrUpdateOut,
)
from document.schemas.outbound import TodayProductionPlanOut
from project.models import Project, ProjectPlan, ProjectLog
from document.models import Quotation, QuotationProduct
from factory.models import FactoryEquipment
from stock.models import Product
from datetime import date, timedelta
from typing import List
from factory.utils import is_factory_member
from dateutil.relativedelta import relativedelta
from websocket.utils import send_notification_to_factory
from project.utils import (
    check_material_availability,
    update_product_avg_production_time_from_recent_plans,
)
from factory.eq_utils import get_equipment_by_id
from project.plan_utils import get_plan_by_id
from django.utils import timezone
from scheduling.api import update_work_instruction_for_factory
from document.utils import create_work_instruction_history


router = Router(tags=["ProjectPlan"], auth=jwt_auth)

@router.post(
    "/create-or-update",
    summary="[C] 프로젝트 생산 계획 생성 또는 수정",
    description="plan_id가 있으면 생산 계획을 수정하고, 없으면 새로 생성합니다. 수량 수정 시 견적서 수량과 일치하도록 자동으로 분할됩니다.",
    response={200: ProjectPlanCreateOrUpdateOut, 400: dict, 404: dict, 500: dict},
)
async def create_or_update_project_plan(request, payload: ProjectPlanCreateOrUpdateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    # 프로젝트 검증
    try:
        project = await Project.objects.aget(id=payload.project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    # 견적서 품목 검증
    try:
        quotation_product = await QuotationProduct.objects.aget(
            id=payload.quotation_product_id
        )

        # 견적서 정보를 async로 가져오기
        quotation = await Quotation.objects.aget(id=quotation_product.quotation_id)
        if quotation.project_id != payload.project_id:
            raise HttpError(400, "견적서 품목이 해당 프로젝트에 속하지 않습니다.")
    except QuotationProduct.DoesNotExist:
        raise HttpError(404, "해당 견적서 품목을 찾을 수 없습니다.")
    except Quotation.DoesNotExist:
        raise HttpError(404, "해당 견적서를 찾을 수 없습니다.")

    # 설비 검증
    equipment = await get_equipment_by_id(payload.equipment_id, factory_id)

    # 수량 검증 (0 가능)
    if payload.quantity < 0:
        raise HttpError(400, "생산 수량은 0보다 커야 합니다.")

    # 반품일때는 생산 수량이 주문 수량보다 작을 수 있다.
    # if payload.total_quantity < payload.total_amount:
    #     raise HttpError(400, "해당 품목의 생산 수량 총합이 주문 수량보다 작습니다.")

    # Product 객체 가져오기 (avg_production_time 결정용)
    product = await Product.objects.aget(id=quotation_product.product_id)
    
    # avg_production_time은 항상 product의 average_production_time 사용 (null 허용)
    avg_production_time = product.average_production_time

    if payload.plan_id:
        # 수정 모드
        try:
            plan = await get_plan_by_id(payload.plan_id)

            old_equipment = (
                await FactoryEquipment.objects.aget(id=plan.equipment_id)
                if plan.equipment_id
                else None
            )

            # 이전 값 저장
            old_start_date = plan.start_date
            old_equipment_id = plan.equipment_id
            old_quantity = plan.quantity
            old_end_date = plan.end_date
            old_avg_production_time = plan.avg_production_time
            old_status = plan.status

            # 값 수정
            plan.equipment = equipment
            plan.quantity = payload.quantity
            plan.defective_quantity = payload.defective_quantity
            plan.start_date = payload.start_date
            plan.end_date = payload.end_date
            plan.avg_production_time = avg_production_time
            if payload.status:
                plan.status = payload.status
            # material_consumed가 payload에 명시된 경우에만 업데이트
            if payload.material_consumed is not None:
                plan.material_consumed = payload.material_consumed

            await plan.asave()

            # 생산계획 완료 시 또는 완료 상태에서 수정 시 최근 50개 완료 계획 기반으로 제품 평균 시간 업데이트
            new_status = plan.status
            is_completed = new_status == ProjectPlan.ProductionStatus.completed
            was_completed = old_status == ProjectPlan.ProductionStatus.completed
            
            # 완료로 변경되거나, 완료 상태에서 start_date/end_date/quantity가 수정된 경우
            if is_completed or (was_completed and (old_start_date != plan.start_date or old_end_date != plan.end_date or old_quantity != plan.quantity)):
                # 최근 50개 완료된 생산계획을 기반으로 제품의 average_production_time 업데이트
                await sync_to_async(update_product_avg_production_time_from_recent_plans)(
                    quotation_product.product_id
                )

            # 불량률을 buffer_rate에 반영 (defective_quantity가 있으면)
            if payload.defective_quantity is not None and payload.defective_quantity > 0 and payload.quantity > 0:
                # 관계 필드 접근을 async로 처리
                product_obj = await Product.objects.aget(
                    id=quotation_product.product_id
                )
                # 불량률 계산: (불량품 수량 / 생산 수량)
                defect_rate = Decimal(payload.defective_quantity) / Decimal(payload.quantity)
                # 최신 불량률로 buffer_rate 업데이트 (누적하지 않음)
                from decimal import ROUND_HALF_UP
                new_buffer_rate = defect_rate.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                product_obj.buffer_rate = new_buffer_rate
                await product_obj.asave()

            # 오늘 생산하는 Plan이면 WorkInstruction 갱신
            if plan.start_date.date() == datetime.now(pytz.timezone(settings.TIME_ZONE)).date():
                await sync_to_async(update_work_instruction_for_factory)(equipment.factory_id)
            
            # WorkInstruction history 기록
            @sync_to_async
            def record_history():
                old_values = {
                    "equipment_id": old_equipment_id,
                    "quantity": old_quantity,
                    "start_date": old_start_date,
                    "end_date": old_end_date,
                    "avg_production_time": old_avg_production_time,
                    "status": old_status,
                }
                # old_equipment가 있으면 설비 이름도 추가
                if old_equipment:
                    old_values["equipment_name"] = old_equipment.name
                
                new_values = {
                    "equipment_id": plan.equipment_id,
                    "quantity": plan.quantity,
                    "start_date": plan.start_date,
                    "end_date": plan.end_date,
                    "avg_production_time": plan.avg_production_time,
                    "status": plan.status,
                }
                # 새 설비 이름도 추가
                new_values["equipment_name"] = equipment.name
                create_work_instruction_history(
                    plan=plan,
                    old_start_date=old_start_date,
                    new_start_date=plan.start_date,
                    changed_by=user,
                    old_values=old_values,
                    new_values=new_values,
                )
            
            await record_history()

            # 설비 변경 로그/알림
            if old_equipment and old_equipment.id != equipment.id:
                # 로그 기록 (프로젝트가 생산대기 상태가 아니고 가동 대기 상태일 때)
                if project.status != Project.ProjectStatus.pending and plan.status == ProjectPlan.ProductionStatus.pending:
                    await ProjectLog.objects.acreate(
                        project=plan.project,
                        type=ProjectLog.LogType.equipment,
                        title="생산 설비 변경",
                        content=f"생산 설비가 {old_equipment.name}라인에서 {equipment.name}라인으로 변경되었어요",
                    )

                # 공장 알림 전송 (프로젝트가 생산대기 상태가 아닐 때)
                if project.status != Project.ProjectStatus.pending:
                    # 표시용 거래처명: 우선 견적서 client_info.name, 없으면 '-'
                    client_name = "-"
                    try:
                        if quotation.client_info and isinstance(quotation.client_info, dict):
                            client_name = quotation.client_info.get("name") or "-"
                    except Exception:
                        client_name = "-"

                    await send_notification_to_factory(
                        factory_id=int(factory_id),
                        notification_type="information",
                        notification_case="production_schedule_changed",
                        content=f"'{client_name}'의 생산 설비가 {(old_equipment.name or '-')}라인에서 {(equipment.name or '-')}라인으로 변경되었어요.",
                        additional_data={"plan_id": plan.id},
                    )

            # 생산 수량이 변경된 경우
            if old_quantity != plan.quantity:
                # 연결된 반품이 있으면 반품의 생산 수량도 함께 업데이트
                is_refund_plan = await sync_to_async(plan.refunds.exists)()

                if is_refund_plan:
                    @sync_to_async
                    def update_refund_production_amounts():
                        refunds = list(plan.refunds.all())
                        for refund in refunds:
                            refund.production_amount = plan.quantity
                            refund.save()

                    await update_refund_production_amounts()

                # 생산 수량 변경 로그 (프로젝트가 생산대기 상태가 아닐 때)
                if project.status != Project.ProjectStatus.pending:
                    change_message = f"생산 수량이 {old_quantity}개에서 {plan.quantity}개로 변경되었어요"
                    await ProjectLog.objects.acreate(
                        project=plan.project,
                        type=ProjectLog.LogType.quantity,
                        title="생산 수량 변경",
                        content=change_message,
                    )

            # 생산 일자 변경 로그 (프로젝트가 생산대기 상태가 아닐 때)
            # 시간 변경만 있을 때는 로그를 남기지 않고, '날짜'가 실제로 바뀐 경우에만 로그를 남긴다.
            if (
                old_start_date
                and plan.start_date
                and old_start_date.date() != plan.start_date.date()
                and project.status != Project.ProjectStatus.pending
            ):
                change_message = f"생산 일자가 {old_start_date.strftime('%m/%d')}일에서 {plan.start_date.strftime('%m/%d')}일로 변경되었어요"
                await ProjectLog.objects.acreate(
                    project=plan.project,
                    type=ProjectLog.LogType.date,
                    title="생산 일자 변경",
                    content=change_message,
                )

            # 알림 전송 (프로젝트가 생산대기 상태가 아닐 때)
            kst_now = timezone.localtime(timezone.now())
            if ((payload.start_date and payload.start_date.date() == kst_now.date()) or (
                old_start_date and old_start_date.date() == kst_now.date()
            )) and project.status != Project.ProjectStatus.pending:
                client_name = "-"
                try:
                    if quotation.client_info and isinstance(quotation.client_info, dict):
                        client_name = quotation.client_info.get("name") or "-"
                except Exception:
                    client_name = "-"

                await send_notification_to_factory(
                    factory_id=int(factory_id),
                    notification_type="information",
                    notification_case="production_schedule_changed",
                    content=f"'{client_name}'의 생산 일정이 변경되었어요.",
                    additional_data={"plan_id": plan.id},
                )

            # # 버퍼 레이트 업데이트
            # if payload.total_quantity >= payload.total_amount:
            #     new_buffer_rate = (payload.total_quantity / payload.total_amount) - 1

            #     # 관계 필드 접근을 async로 처리
            #     product_obj = await Product.objects.aget(
            #         id=quotation_product.product_id
            #     )
            #     product_obj.buffer_rate = new_buffer_rate
            #     await product_obj.asave()

            return 200, ProjectPlanCreateOrUpdateOut(
                message="프로젝트 생산 계획이 성공적으로 수정되었습니다.",
                plan_id=plan.id,
                action="updated",
            )

        except Exception as e:
            raise HttpError(404, f"생산 계획을 찾을 수 없습니다: {str(e)}")

    else:
        # 생성 모드
        # # 버퍼 레이트 업데이트
        # if payload.total_quantity >= payload.total_amount:
        #     new_buffer_rate = (payload.total_quantity / payload.total_amount) - 1

        #     # 관계 필드 접근을 async로 처리
        #     product_obj = await Product.objects.aget(id=quotation_product.product_id)
        #     product_obj.buffer_rate = new_buffer_rate
        #     await product_obj.asave()

        # ProjectPlan 생성
        plan = await ProjectPlan.objects.acreate(
            project=project,
            product=quotation_product,
            equipment=equipment,
            quantity=payload.quantity,
            defective_quantity=payload.defective_quantity,
            start_date=payload.start_date,
            end_date=payload.end_date,
            avg_production_time=avg_production_time,
            status=payload.status or ProjectPlan.ProductionStatus.pending,
            material_consumed=payload.material_consumed
            if payload.material_consumed is not None
            else False,
        )

        # 오늘 생산하는 Plan이면 WorkInstruction 갱신
        if plan.start_date.date() == datetime.now(pytz.timezone(settings.TIME_ZONE)).date():
            await sync_to_async(update_work_instruction_for_factory)(equipment.factory_id)
            
            # WorkInstruction history 기록 (추가)
            @sync_to_async
            def record_creation_history():
                new_values = {
                    "equipment_id": plan.equipment_id,
                    "quantity": plan.quantity,
                    "start_date": plan.start_date,
                    "end_date": plan.end_date,
                    "avg_production_time": plan.avg_production_time,
                    "status": plan.status,
                }
                create_work_instruction_history(
                    plan=plan,
                    old_start_date=None,
                    new_start_date=plan.start_date,
                    changed_by=user,
                    old_values=None,
                    new_values=new_values,
                )
            
            await record_creation_history()

        return 200, ProjectPlanCreateOrUpdateOut(
            message="프로젝트 생산 계획이 성공적으로 생성되었습니다.",
            plan_id=plan.id,
            action="created",
        )


@router.get(
    "/today",
    summary="[C] 오늘 생산 시작인 프로젝트 계획 조회",
    description="오늘이 생산 시작인 프로젝트 계획을 조회합니다.",
    response={200: list[TodayProductionPlanOut], 400: dict, 404: dict, 500: dict},
)
async def list_today_production_plans(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        # Django 설정의 TIME_ZONE 기준으로 오늘 날짜 계산
        local_tz = pytz.timezone(settings.TIME_ZONE)
        today_local = datetime.now(local_tz).date()

        @sync_to_async
        def get_today_plans():
            return list(
                ProjectPlan.objects.select_related(
                    "product__quotation__client", "product__product", "equipment"
                )
                .filter(
                    product__quotation__factory_id=int(factory_id),
                    start_date__date=today_local,  # Django TIME_ZONE 기준 오늘 하루(00:00~23:59:59)
                )
                .order_by(
                    "product__product__id", "created_at"
                )  # 품목 순, 생성일 순으로 정렬
            )

        today_plans = await get_today_plans()

        if not today_plans:
            raise HttpError(404, "오늘 생산 시작인 프로젝트 계획이 없습니다.")

        # 응답 데이터 구성
        @sync_to_async
        def build_response_data():
            results = []
            for plan in today_plans:
                results.append(
                    {
                        "company_name": plan.product.quotation.client.name,  # 업체명
                        "product_id": plan.product.product.id,  # 품목 ID
                        "product_name": plan.product.product.name,  # 품목명
                        "product_code": plan.product.product.code,  # 품목코드
                        "product_note": plan.product.product.note,  # 품목 메모
                        "spec": plan.product.product.spec,  # 규격
                        "unit": plan.product.product.unit,  # 단위
                        "production_quantity": plan.quantity,  # 생산 수량
                        "equipment_name": plan.equipment.name,  # 생산 설비
                        "production_time": plan.avg_production_time,  # 생산 시간 (초)
                        "start_date": plan.start_date,  # 생산 시작일
                        "end_date": plan.end_date,  # 생산 종료일
                        "project_id": plan.product.quotation.project.id,  # 프로젝트 ID
                    }
                )
            return results

        results = await build_response_data()

        return 200, results

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/dashboard",
    summary="[C] 대시보드 조회",
    description="대시보드 조회",
    response={200: DashboardOut, 400: dict, 404: dict, 500: dict},
)
async def get_dashboard(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        today = date.today()
        current_month_start = today.replace(day=1)
        current_month_end = (current_month_start + relativedelta(months=1)) - timedelta(
            days=1
        )

        # 지난달 계산
        previous_month_start = current_month_start - relativedelta(months=1)
        previous_month_end = current_month_start - timedelta(days=1)

        @sync_to_async
        def get_dashboard_data():
            # 1. 이번달에 생성된 프로젝트 건수 (quotation, confirmed, suspended 제외)
            current_month_projects = (
                Project.objects.filter(
                    quotations__factory_id=int(factory_id),
                    created_at__date__gte=current_month_start,
                    created_at__date__lte=current_month_end,
                )
                .exclude(
                    status__in=[
                        Project.ProjectStatus.quotation,
                        Project.ProjectStatus.confirmed,
                        Project.ProjectStatus.suspended,
                    ]
                )
                .count()
            )

            # 2. 지난달에 생성된 프로젝트 건수 (quotation, confirmed, suspended 제외)
            previous_month_projects = (
                Project.objects.filter(
                    quotations__factory_id=int(factory_id),
                    created_at__date__gte=previous_month_start,
                    created_at__date__lte=previous_month_end,
                )
                .exclude(
                    status__in=[
                        Project.ProjectStatus.quotation,
                        Project.ProjectStatus.confirmed,
                        Project.ProjectStatus.suspended,
                    ]
                )
                .count()
            )

            # 3. 재고 수량이 안전재고보다 낮은 원자재 개수
            from stock.models import Material

            shortage_materials_count = Material.objects.filter(
                factory_id=int(factory_id), current_stock__lt=models.F("standard_stock")
            ).count()

            # 4. 현재 달로부터 5개월치 월별 생산 수익
            monthly_profits = []
            for i in range(5):
                month_start = current_month_start - relativedelta(months=i)
                month_end = (month_start + relativedelta(months=1)) - timedelta(days=1)

                # 해당 월에 완료된 프로젝트 조회
                completed_projects = Project.objects.filter(
                    quotations__factory_id=int(factory_id),
                    status=Project.ProjectStatus.completed,  # "completed" 영문 값 사용
                    created_at__date__gte=month_start,
                    created_at__date__lte=month_end,
                )

                month_profit = 0
                for project in completed_projects:
                    # 프로젝트의 모든 견적서 품목의 수익 계산
                    quotation_products = QuotationProduct.objects.filter(
                        quotation__project=project,
                        quotation__factory_id=int(factory_id),
                    )

                    for qp in quotation_products:
                        # 품목 가격 (수량 * 단가)
                        product_revenue = qp.quantity * qp.unit_price

                        # 원자재 비용 계산
                        # from stock.models import MaterialProduct

                        # material_products = MaterialProduct.objects.filter(
                        #     product=qp.product
                        # )

                        material_cost = 0
                        # for mp in material_products:
                        #     # 원자재 단가 (cost_average 필드 사용)
                        #     material_unit_cost = mp.material.cost_average
                        #     material_cost += mp.quantity * material_unit_cost

                        # 수익 = 품목 가격 - 원자재 비용
                        profit = product_revenue - material_cost
                        month_profit += profit

                monthly_profits.append(
                    {"month": month_start.strftime("%Y-%m"), "profit": month_profit}
                )

            # 5. 작년 동일 기간 월별 생산 수익
            last_year_monthly_profits = []
            for i in range(5):
                month_start = (
                    current_month_start
                    - relativedelta(months=i)
                    - relativedelta(years=1)
                )
                month_end = (month_start + relativedelta(months=1)) - timedelta(days=1)

                # 해당 월에 완료된 프로젝트 조회
                completed_projects = Project.objects.filter(
                    quotations__factory_id=int(factory_id),
                    status=Project.ProjectStatus.completed,  # "completed" 영문 값 사용
                    created_at__date__gte=month_start,
                    created_at__date__lte=month_end,
                )

                month_profit = 0
                for project in completed_projects:
                    # 프로젝트의 모든 견적서 품목의 수익 계산
                    quotation_products = QuotationProduct.objects.filter(
                        quotation__project=project,
                        quotation__factory_id=int(factory_id),
                    )

                    for qp in quotation_products:
                        # 품목 가격 (수량 * 단가)
                        product_revenue = qp.quantity * qp.unit_price

                        # 원자재 비용 계산
                        from stock.models import MaterialProduct

                        material_products = MaterialProduct.objects.filter(
                            product=qp.product
                        )

                        material_cost = 0
                        for mp in material_products:
                            # 원자재 단가 (cost_average 필드 사용)
                            material_unit_cost = mp.material.cost_average
                            material_cost += mp.quantity * material_unit_cost

                        # 수익 = 품목 가격 - 원자재 비용
                        profit = product_revenue - material_cost
                        month_profit += profit

                last_year_monthly_profits.append(
                    {"month": month_start.strftime("%Y-%m"), "profit": month_profit}
                )

            return {
                "current_month_projects": current_month_projects,
                "previous_month_projects": previous_month_projects,
                "shortage_materials_count": shortage_materials_count,
                "monthly_profits": monthly_profits,
                "last_year_monthly_profits": last_year_monthly_profits,
            }

        result = await get_dashboard_data()
        return 200, DashboardOut(**result)

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"대시보드 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "",
    summary="[C] 프로젝트 생산 계획 조회",
    description="project_id로 해당 프로젝트의 모든 생산 계획을 조회합니다.",
    response={200: List[ProjectPlanDetailWithRelationsOut], 404: dict, 500: dict},
)
async def list_project_plans(request, project_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        project = await Project.objects.aget(id=project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    plans = await sync_to_async(list)(
        ProjectPlan.objects.filter(project=project).order_by("product_id", "created_at")
    )

    if not plans:
        raise HttpError(404, "해당 프로젝트에 생성된 생산 계획이 없습니다.")

    plans_detail_list = []

    for plan in plans:
        quotation_product = await QuotationProduct.objects.aget(id=plan.product_id)
        product = await Product.objects.aget(id=quotation_product.product_id)
        equipment = await FactoryEquipment.objects.aget(id=plan.equipment_id)

        # Material 수량 충분성 확인
        material_status = await check_material_availability(product.id, plan.quantity)

        # 해당 생산 계획이 반품에서 생성된 계획인지 여부
        is_refund_plan = await sync_to_async(plan.refunds.exists)()

        plans_detail_list.append(
            ProjectPlanDetailWithRelationsOut(
                id=plan.id,
                project_id=project_id,
                quotation_product=QuotationProductDetailOut(
                    id=quotation_product.id,
                    product=ProductDetailOut(
                        id=product.id,
                        name=product.name,
                        code=product.code,
                        unit=product.unit,
                        spec=product.spec,
                        buffer_rate=float(product.buffer_rate) if product.buffer_rate is not None else None,
                    ),
                    quantity=quotation_product.quantity,
                    unit_price=quotation_product.unit_price,
                    is_delivery=quotation_product.is_delivery,
                    delivery_date=quotation_product.delivery_date,
                ),
                equipment=EquipmentDetailOut(
                    id=equipment.id, name=equipment.name, priority=equipment.priority
                ),
                status=plan.status,
                quantity=plan.quantity,
                defective_quantity=plan.defective_quantity,
                start_date=plan.start_date,
                end_date=plan.end_date,
                avg_production_time=plan.avg_production_time,
                material_status=material_status,
                material_consumed=plan.material_consumed,
                is_refund_plan=is_refund_plan,
            )
        )

    return 200, plans_detail_list


@router.delete(
    "/{plan_id}",
    summary="[C] 프로젝트 생산 계획 삭제",
    description="생산 계획을 삭제합니다.",
    response={204: None, 400: dict, 404: dict, 500: dict},
)
async def delete_project_plan(request, plan_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        plan = await ProjectPlan.objects.aget(id=plan_id)
    except ProjectPlan.DoesNotExist:
        raise HttpError(404, "해당 생산 계획을 찾을 수 없습니다.")

    # 삭제 전에 오늘 생산하는 Plan이면 WorkInstruction 갱신 및 history 기록
    if plan.start_date.date() == datetime.now(pytz.timezone(settings.TIME_ZONE)).date():
        # WorkInstruction history 기록 (삭제)
        @sync_to_async
        def record_deletion_history():
            old_values = {
                "equipment_id": plan.equipment_id,
                "quantity": plan.quantity,
                "start_date": plan.start_date,
                "end_date": plan.end_date,
                "avg_production_time": plan.avg_production_time,
                "status": plan.status,
            }
            create_work_instruction_history(
                plan=plan,
                old_start_date=plan.start_date,
                new_start_date=None,
                changed_by=user,
                old_values=old_values,
                new_values=None,
            )
        
        await record_deletion_history()
        await sync_to_async(update_work_instruction_for_factory)(plan.equipment.factory_id)

    await plan.adelete()

    return 204, None