from ninja import Router, Query
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from datetime import datetime, timedelta
from typing import List
from api.security import jwt_auth

from project.models import Project, ProjectLog, Refund, ProjectPlan
from project.schemas.outbound import (
    RefundCreateOut,
    RefundUpdateOut,
    RefundListOut,
    RefundDetailOut,
    RefundProductionRegistrationOut,
)
from project.schemas.inbound import RefundCreateIn, RefundUpdateIn
from stock.models import Product
from document.models import Quotation, QuotationProduct
from project.utils import (
    validate_factory_and_get_user,
    get_refund_with_project,
    parse_and_validate_date,
    get_default_equipment,
    consume_raw_materials,
)


router = Router(tags=["ProjectRefund"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 반품 생성",
    description="반품을 생성하고 관련 로그를 기록합니다. 현재 재고는 Product의 실제 재고량에서 자동으로 가져옵니다.",
    response={200: RefundCreateOut, 400: dict, 404: dict, 500: dict},
)
async def create_refund(request, payload: RefundCreateIn):
    factory_id, user = await validate_factory_and_get_user(request)

    try:
        project = await sync_to_async(Project.objects.get)(id=payload.project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    try:
        product = await sync_to_async(Product.objects.get)(id=payload.product_id)
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")

    # 팩토리 권한 확인
    quotation_exists = await sync_to_async(
        project.quotations.filter(factory_id=factory_id).exists
    )()
    if not quotation_exists:
        raise HttpError(404, "해당 프로젝트에 대한 권한이 없습니다.")

    # Product의 실제 현재 재고를 사용
    current_stock = product.current_stock
    production_amount = (
        payload.production_amount if payload.production_amount is not None else 0
    )
    refund_amount = current_stock + production_amount

    if refund_amount <= 0:
        raise HttpError(400, "반품 수량은 0보다 커야 합니다.")

    refund_date = await parse_and_validate_date(payload.refund_date)

    # Refund 생성
    refund = await sync_to_async(Refund.objects.create)(
        product=product,
        amount=refund_amount,
        refund_date=refund_date,
        current_stock=current_stock,
        production_amount=production_amount,
    )

    log = await sync_to_async(ProjectLog.objects.create)(
        project=project,
        type=ProjectLog.LogType.refund,
        title="반품 접수 현황",
        content=f"{product.name} {refund_amount}개가 반품되었어요.",
        refund=refund,
    )

    project.is_refunded = True
    await project.asave()

    return 200, {
        "message": "반품이 성공적으로 생성되었습니다.",
        "refund_id": refund.id,
        "log_id": log.id,
    }


@router.post(
    "/log/{log_id}/production",
    summary="[C] 반품 생산 등록",
    description="로그 ID를 통해 반품을 확인하고, plan이 비어있으면 생성하고, plan이 있으면 해당 plan_id로 수정합니다.",
    response={200: RefundProductionRegistrationOut, 400: dict, 404: dict, 500: dict},
)
async def register_production_from_refund_log(request, log_id: int):
    factory_id, user = await validate_factory_and_get_user(request)

    # log_id를 통해 ProjectLog를 찾고 refund 정보를 가져옵니다
    try:
        log = await sync_to_async(ProjectLog.objects.get)(id=log_id)
        if log.type != ProjectLog.LogType.refund:
            raise HttpError(400, "해당 로그는 반품 로그가 아닙니다.")

        # refund와 project 정보를 sync_to_async로 가져오기
        refund = await sync_to_async(lambda: log.refund)()
        if not refund:
            raise HttpError(404, "해당 로그에 연결된 반품 정보를 찾을 수 없습니다.")

        project = await sync_to_async(lambda: log.project)()
    except ProjectLog.DoesNotExist:
        raise HttpError(404, "해당 로그를 찾을 수 없습니다.")

    # 반품 수량이 0보다 큰지 확인
    refund_amount = await sync_to_async(lambda: refund.amount)()
    if refund_amount <= 0:
        raise HttpError(400, "반품 수량이 0보다 커야 합니다.")

    # plan이 이미 있는지 확인
    existing_plan = await sync_to_async(lambda: refund.plan)()

    try:
        # 1. 기존 Quotation 찾기 (같은 프로젝트의 첫 번째 견적서)
        existing_quotation = await sync_to_async(
            project.quotations.filter(factory_id=factory_id).first
        )()

        if not existing_quotation:
            raise HttpError(404, "해당 프로젝트의 견적서를 찾을 수 없습니다.")

        # 2. 새로운 QuotationProduct 생성 (반품용)
        refund_product = await sync_to_async(lambda: refund.product)()
        new_quotation_product = await sync_to_async(QuotationProduct.objects.create)(
            quotation=existing_quotation,
            product=refund_product,
            quantity=refund_amount,
            unit_price=0,  # 반품은 단가 0으로 설정
            delivery_date=datetime.now().date()
            + timedelta(days=7),  # 기본 7일 후 납품 예정
        )

        # 3. 기본 장비 선택
        default_equipment = await get_default_equipment(factory_id)

        # 4. 원자재 소모 처리
        await consume_raw_materials(refund_product, refund_amount)

        # 5. 생산 계획 생성 또는 수정
        if existing_plan:
            # 기존 plan이 있는 경우 수정
            project_plan = existing_plan
            project_plan.product = new_quotation_product
            project_plan.equipment = default_equipment
            project_plan.quantity = refund_amount

            # 품목의 평균 생산 시간 가져오기 (기본값 30초)
            avg_production_time = await sync_to_async(
                lambda: refund_product.average_production_time
            )()
            if avg_production_time is None:
                avg_production_time = 30  # 기본값 30초

            # 마감 시간 계산: 시작일 + (평균 생산 시간 × 수량)
            total_production_seconds = avg_production_time * refund_amount
            production_days = int(total_production_seconds / (24 * 3600))
            if production_days == 0:
                production_days = 1  # 최소 1일
            start_date = datetime.now().date()
            end_date = start_date + timedelta(days=production_days)

            project_plan.start_date = start_date
            project_plan.end_date = end_date
            project_plan.avg_production_time = avg_production_time

            await project_plan.asave()

            # 6. 프로젝트 로그 생성 (수정)
            production_log = await sync_to_async(ProjectLog.objects.create)(
                project=project,
                type="계획 변경",
                title="반품 재생산 계획 수정",
                content=f"{refund_product.name} {refund_amount}개 반품 재생산 계획이 수정되었습니다.",
            )
        else:
            # 기존 plan이 없는 경우 새로 생성
            # 품목의 평균 생산 시간 가져오기 (기본값 30초)
            avg_production_time = await sync_to_async(
                lambda: refund_product.average_production_time
            )()
            if avg_production_time is None:
                avg_production_time = 30  # 기본값 30초

            # 마감 시간 계산: 시작일 + (평균 생산 시간 × 수량)
            total_production_seconds = avg_production_time * refund_amount
            production_days = int(total_production_seconds / (24 * 3600))
            if production_days == 0:
                production_days = 1  # 최소 1일
            start_date = datetime.now().date()
            end_date = start_date + timedelta(days=production_days)

            project_plan = await sync_to_async(ProjectPlan.objects.create)(
                project=project,
                product=new_quotation_product,  # 새로운 QuotationProduct 사용
                equipment=default_equipment,
                status="가동 대기",
                quantity=refund_amount,
                start_date=start_date,
                end_date=end_date,
                avg_production_time=avg_production_time,  # 품목의 평균 생산 시간 사용
            )

            # refund.plan을 sync_to_async로 설정
            await sync_to_async(setattr)(refund, "plan", project_plan)
            await refund.asave()

            # 6. 프로젝트 로그 생성 (새로 생성)
            production_log = await sync_to_async(ProjectLog.objects.create)(
                project=project,
                type="계획 변경",
                title="반품 재생산 등록",
                content=f"{refund_product.name} {refund_amount}개 반품 재생산이 등록되었습니다.",
            )

        return 200, {
            "message": "반품 재생산이 성공적으로 처리되었습니다.",
            "action": "수정" if existing_plan else "생성",
            "refund_id": await sync_to_async(lambda: refund.id)(),
            "quotation_id": existing_quotation.id,
            "quotation_product_id": new_quotation_product.id,
            "project_plan_id": project_plan.id,
            "production_log_id": production_log.id,
            "product_name": refund_product.name,
            "quantity": refund_amount,
            "equipment_name": default_equipment.name,
        }

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"생산 등록 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{refund_id}",
    summary="[C] 반품 상세 조회",
    description="특정 반품의 상세 정보를 조회합니다.",
    response={200: RefundDetailOut, 400: dict, 404: dict, 500: dict},
)
async def get_refund_detail(request, refund_id: int):
    factory_id, user = await validate_factory_and_get_user(request)
    refund, project = await get_refund_with_project(refund_id, factory_id)

    # 관련 로그 조회
    project_log = await sync_to_async(ProjectLog.objects.get)(refund=refund)

    return 200, {
        "id": refund.id,
        "product": {
            "id": refund.product.id,
            "name": refund.product.name,
            "code": refund.product.code,
            "current_stock": refund.product.current_stock,
        },
        "project": {
            "id": project.id,
            "status": project.status,
        },
        "amount": refund.amount,
        "current_stock": refund.current_stock,
        "production_amount": refund.production_amount,
        "refund_date": refund.refund_date.isoformat() if refund.refund_date else None,
        "log": {
            "id": project_log.id,
            "title": project_log.title,
            "content": project_log.content,
            "created_at": project_log.created_at.isoformat(),
        },
        "created_at": refund.created_at.isoformat(),
        "updated_at": refund.updated_at.isoformat(),
    }


@router.patch(
    "/{refund_id}",
    summary="[C] 반품 수정",
    description="반품 정보를 수정합니다. 반품 수량은 current_stock과 production_amount의 합으로 자동 계산됩니다.",
    response={200: RefundUpdateOut, 400: dict, 404: dict, 500: dict},
)
async def update_refund(request, refund_id: int, payload: RefundUpdateIn):
    factory_id, user = await validate_factory_and_get_user(request)
    refund, project = await get_refund_with_project(refund_id, factory_id)

    # 수정할 필드들을 업데이트
    update_fields = {}

    if payload.refund_date is not None:
        refund_date = await parse_and_validate_date(payload.refund_date)
        update_fields["refund_date"] = refund_date

    # current_stock은 수정 불가, 기존 값 사용
    current_stock = refund.current_stock
    production_amount = (
        payload.production_amount
        if payload.production_amount is not None
        else refund.production_amount
    )

    # 반품 수량 재계산
    new_refund_amount = current_stock + production_amount
    if new_refund_amount <= 0:
        raise HttpError(400, "반품 수량은 0보다 커야 합니다.")

    # 원래 반품 수량 저장 (ProjectPlan 비교용)
    original_refund_amount = refund.amount

    # 제품 변경 처리 (반품 업데이트 전에 실행)
    product_changed = False
    old_product = None
    if payload.product_id is not None:
        product_changed = payload.product_id != refund.product.id
        if product_changed:
            old_product = refund.product
            # 새로운 제품으로 업데이트
            try:
                new_product = await sync_to_async(Product.objects.get)(
                    id=payload.product_id
                )
                update_fields["product"] = new_product
            except Product.DoesNotExist:
                raise HttpError(404, "해당 제품을 찾을 수 없습니다.")

    update_fields["amount"] = new_refund_amount
    update_fields["production_amount"] = production_amount

    # 반품 정보 업데이트
    for field, value in update_fields.items():
        setattr(refund, field, value)
    await sync_to_async(refund.save)()

    # 프로젝트 로그 내용도 업데이트
    project_log = await sync_to_async(ProjectLog.objects.get)(refund=refund)
    log_content = f"{refund.product.name} {new_refund_amount}개가 반품되었어요."
    project_log.content = log_content
    await sync_to_async(project_log.save)()

    # 연결된 ProjectPlan이 있는지 확인하고 수정 (생산 등록된 경우만)
    updated_plans = []
    deleted_plans = []
    created_plans = []

    # refund.plan에 async 접근을 위해 sync_to_async 사용
    refund_plan = await sync_to_async(lambda: refund.plan)()

    if refund_plan is not None:  # 생산 등록된 반품인 경우만 처리
        related_project_plans = await sync_to_async(list)(
            ProjectPlan.objects.filter(
                project=project,
                product__product=refund.product,  # QuotationProduct의 product 필드
            )
        )

        if product_changed:
            # 제품이 완전히 바뀐 경우: 기존 제품의 ProjectPlan 삭제
            old_product_plans = await sync_to_async(list)(
                ProjectPlan.objects.filter(
                    project=project, product__product=old_product  # 기존 제품
                )
            )
            for plan in old_product_plans:
                if plan.quantity == original_refund_amount:
                    plan_id = plan.id  # 삭제 전에 ID 저장

                    # 연결된 Refund가 CASCADE로 삭제되지 않도록 plan 필드를 None으로 설정
                    plan_refunds = await sync_to_async(list)(plan.refunds.all())
                    for plan_refund in plan_refunds:
                        plan_refund.plan = None
                        await sync_to_async(plan_refund.save)()

                    await sync_to_async(plan.delete)()
                    deleted_plans.append(plan_id)

            # 새로운 제품으로 ProjectPlan 생성
            try:
                # 새로운 제품의 QuotationProduct 찾기
                new_quotation_product = await sync_to_async(
                    QuotationProduct.objects.filter(
                        quotation__project=project,
                        product=update_fields.get(
                            "product", refund.product
                        ),  # 새로운 제품 또는 기존 제품
                    ).first
                )()

                if new_quotation_product:
                    # 기본 장비 선택
                    default_equipment = await get_default_equipment(factory_id)

                    # 새로운 ProjectPlan 생성
                    new_project_plan = await sync_to_async(ProjectPlan.objects.create)(
                        project=project,
                        product=new_quotation_product,
                        equipment=default_equipment,
                        status="가동 대기",
                        quantity=new_refund_amount,
                        start_date=datetime.now().date(),
                        end_date=datetime.now().date() + timedelta(days=7),
                        avg_production_time=3600,
                    )
                    created_plans.append(new_project_plan.id)
            except Exception:
                # 새로운 제품의 QuotationProduct가 없는 경우 무시
                pass
        else:
            # 같은 제품인 경우: 수량만 수정
            for plan in related_project_plans:
                if plan.quantity == original_refund_amount:
                    plan.quantity = new_refund_amount
                    await sync_to_async(plan.save)()
                    updated_plans.append(plan.id)

    return 200, {
        "message": "반품이 성공적으로 수정되었습니다.",
        "refund_id": refund.id,
        "updated_project_plans": updated_plans,
        "deleted_project_plans": deleted_plans,
        "created_project_plans": created_plans,
    }
