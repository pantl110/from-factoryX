from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, TYPE_CHECKING
from django.utils import timezone
from project.models import Refund, Project, ProjectLog, ProjectPlan
from stock.models import MaterialProduct, Product
from factory.models import FactoryEquipment
from django.db.models import Max

if TYPE_CHECKING:
    from document.models import QuotationProduct


async def get_project_by_id(project_id):
    try:
        project = (
            await Project.objects.select_related("tax_invoice")
            .prefetch_related(
                "quotations__products__product",
                "quotations__client",
                "plans",
                "logs",
            )
            .annotate(
                max_delivery_date=Max("quotations__products__delivery_date"),
            )
            .aget(id=project_id)
        )
        return project
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")


async def validate_factory_and_get_user(request) -> Tuple[int, object]:
    """팩토리 ID 검증 및 사용자 정보 반환"""
    from api.security import jwt_auth
    from factory.utils import is_factory_member

    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)
    return int(factory_id), user


async def get_refund_with_project(
    refund_id: int, factory_id: int
) -> Tuple[Refund, Project]:
    """refund_id로 반품과 관련 프로젝트를 조회하고 팩토리 권한 확인"""
    try:
        refund = await Refund.objects.select_related("product", "plan").aget(
            id=refund_id
        )
    except Refund.DoesNotExist:
        raise HttpError(404, "해당 반품을 찾을 수 없습니다.")

    # refund_id로 ProjectLog를 찾아서 project 가져오기
    try:
        project_log = (
            await ProjectLog.objects.select_related("project")
            .prefetch_related("project__quotations")
            .aget(refund=refund)
        )
        project = project_log.project
    except ProjectLog.DoesNotExist:
        raise HttpError(404, "해당 반품과 연결된 프로젝트 로그를 찾을 수 없습니다.")

    # 팩토리 권한 확인
    quotation_exists = await project.quotations.filter(factory_id=factory_id).aexists()
    if not quotation_exists:
        raise HttpError(404, "해당 반품을 찾을 수 없습니다.")

    return refund, project


async def parse_and_validate_date(date_string: str) -> datetime.date:
    """날짜 문자열을 파싱하고 검증"""
    try:
        return datetime.strptime(date_string, "%Y-%m-%d").date()
    except ValueError:
        raise HttpError(
            400, "올바르지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 입력해주세요."
        )


# async def get_default_equipment(factory_id: int) -> FactoryEquipment:
#     """기본 장비 조회"""
#     equipment = await sync_to_async(
#         FactoryEquipment.objects.filter(factory_id=factory_id)
#         .order_by("priority")
#         .first
#     )()
#     if not equipment:
#         raise HttpError(400, "사용 가능한 장비가 없습니다.")
#     return equipment


async def recommend_equipment(
    factory_id: int,
    quantity: int,
    avg_production_time: int,
    excluded_equipment_ids: Optional[List[int]] = None,
    additional_plans_by_equipment: Optional[dict] = None,
) -> Optional[Tuple[FactoryEquipment, datetime]]:
    """
    가장 빨리 시작할 수 있는 설비를 추천합니다.
    생산에 필요한 시간을 고려하여 충분한 시간 슬롯이 있는 설비를 선택합니다.
    시작 시간은 항상 5분 단위(00, 05, 10, ...)로 맞춥니다.
    
    Args:
        factory_id: 공장 ID
        quantity: 생산 수량
        avg_production_time: 단위당 평균 생산 시간(초)
        excluded_equipment_ids: 제외할 설비 ID 목록 (이미 할당된 설비)
    
    Returns:
        (추천된 설비 객체, 시작 가능한 시간) 튜플, 없으면 None
    
    로직:
        1. 필요한 생산 시간 계산 (수량 × 단위당 생산 시간)
        2. 각 설비의 사용 가능한 시간 슬롯을 찾아서 충분한지 확인
        3. 시작 시간을 5분 단위로 올림(ceil)하여 슬롯 검증 // 시작 시간을 5분단위로만 시작하게 하기 위함 (3시 3분 시작 아니고 3시 5분으로)
        4. 충분한 슬롯이 있는 설비 중 사용 가능한 시간이 가장 빠른 설비를 선택
        5. 같은 시간에 사용 가능한 설비가 여러 개면 priority로 결정
        6. 이미 할당된 설비는 제외
    """
    if excluded_equipment_ids is None:
        excluded_equipment_ids = []

    # 필요한 생산 시간 계산 (초)
    required_production_seconds = quantity * avg_production_time

    def ceil_to_5_minutes(dt: datetime) -> datetime:
        """
        주어진 datetime을 기준으로, 같은 시각 또는 이후의 가장 가까운 5분 단위로 올림합니다.
        예: 10:02 -> 10:05, 10:05 -> 10:05, 10:59 -> 11:00
        """
        dt = dt.replace(second=0, microsecond=0)
        minutes_mod = dt.minute % 5
        if minutes_mod == 0:
            return dt
        add_minutes = 5 - minutes_mod
        return dt + timedelta(minutes=add_minutes)

    @sync_to_async
    def get_equipment_with_availability():
        # 해당 공장의 모든 설비 조회
        equipments = list(
            FactoryEquipment.objects.filter(factory_id=factory_id)
            .exclude(id__in=excluded_equipment_ids)
            .order_by("priority")
        )

        if not equipments:
            return None

        now = timezone.now()
        now_rounded = ceil_to_5_minutes(now)
        equipment_availability = []

        for equipment in equipments:
            # 해당 설비의 진행 중이거나 대기 중인 plan들을 start_date 순으로 조회
            plans = list(
                ProjectPlan.objects.filter(
                    equipment=equipment,
                    status__in=[
                        ProjectPlan.ProductionStatus.pending,
                        ProjectPlan.ProductionStatus.production,
                    ],
                ).order_by("start_date")
            )

            # 이번 배치에서 아직 저장되지 않은 임시 plan들도 함께 고려
            if additional_plans_by_equipment:
                extra_plans = additional_plans_by_equipment.get(equipment.id, [])
                if extra_plans:
                    plans.extend(extra_plans)
                    # start_date 기준으로 다시 정렬 (None 은 가장 뒤로 보냄)
                    plans.sort(
                        key=lambda p: p.start_date
                        if p.start_date is not None
                        else timezone.datetime.max.replace(tzinfo=timezone.utc)
                    )

            # 사용 가능한 시간 슬롯 찾기 (5분 단위로 맞춘 시작 시각)
            available_start_time = None

            if not plans:
                # plan이 없으면 현재 시간의 다음 5분 단위부터 무제한 사용 가능
                available_start_time = now_rounded
            else:
                # 현재 진행 중인 plan이 있는지 확인
                current_plan = None
                for plan in plans:
                    if (
                        plan.start_date
                        and plan.start_date <= now
                        and plan.end_date
                        and plan.end_date > now
                    ):
                        current_plan = plan
                        break

                # 시작 시간 결정 (5분 단위로 맞추기 전의 raw 값)
                if current_plan:
                    # 진행 중인 plan이 있으면, 그 plan이 끝나는 시간 이후부터 확인
                    slot_start = current_plan.end_date
                else:
                    # 진행 중인 plan이 없으면, 현재 시간부터 확인
                    slot_start = now

                # 5분 단위로 올림
                slot_start = ceil_to_5_minutes(slot_start)

                # slot_start 이후의 사용 가능한 시간 슬롯 찾기
                found_slot = False
                for plan in plans:
                    # start_date가 없거나 slot_start 이전/동일인 plan은 건너뛰되,
                    # end_date가 slot_start 이후라면 slot_start를 그 end_date 이후 5분 단위로 다시 맞춰줌
                    if not plan.start_date or plan.start_date <= slot_start:
                        if plan.end_date and plan.end_date > slot_start:
                            slot_start = ceil_to_5_minutes(plan.end_date)
                        continue

                    # plan.start_date 이전까지 사용 가능한 슬롯이 있는지 확인
                    slot_end = plan.start_date
                    # 슬롯 길이를 초 단위로 계산
                    slot_duration = (slot_end - slot_start).total_seconds()

                    if slot_duration >= required_production_seconds:
                        # 충분한 시간 슬롯을 찾음
                        available_start_time = slot_start
                        found_slot = True
                        break

                    # 다음 슬롯 확인을 위해 slot_start 업데이트 (plan의 end_date 기준)
                    if plan.end_date:
                        slot_start = ceil_to_5_minutes(plan.end_date)
                    else:
                        # end_date가 없으면 이 plan 이후는 사용 불가
                        break

                if not found_slot:
                    # 모든 plan 이후에 사용 가능한 슬롯이 있는지 확인
                    last_plan = plans[-1]
                    if last_plan.end_date:
                        # 마지막 plan의 end_date 이후 5분 단위부터 무제한 사용 가능
                        available_start_time = ceil_to_5_minutes(last_plan.end_date)
                    elif not current_plan:
                        # 진행 중인 plan도 없고 마지막 plan의 end_date도 없으면
                        # 현재 시간 기준으로 다시 5분 단위 정렬된 now_rounded 사용
                        available_start_time = now_rounded
                    else:
                        # 진행 중인 plan이 있고 마지막 plan의 end_date가 없으면 사용 불가
                        available_start_time = None

            # 사용 가능한 슬롯이 있는지 확인
            if available_start_time is None:
                continue

            equipment_availability.append(
                {
                    "equipment": equipment,
                    "available_time": available_start_time,
                    "priority": equipment.priority,
                }
            )

        # 사용 가능한 시간이 가장 빠른 것, 같으면 priority가 높은 것(낮은 숫자) 순으로 정렬
        equipment_availability.sort(
            key=lambda x: (x["available_time"], x["priority"])
        )

        if not equipment_availability:
            return None

        best = equipment_availability[0]
        return (best["equipment"], best["available_time"])

    return await get_equipment_with_availability()


async def recommend_equipment_and_create_plan(
    project: Project,
    quotation_product: "QuotationProduct",
    factory_id: int,
    quantity: int,
    product_avg_production_time: Optional[int] = None,
    status: str = ProjectPlan.ProductionStatus.pending,
    defective_quantity: Optional[int] = None,
    additional_plans_by_equipment: Optional[dict] = None,
    save: bool = True,
) -> Tuple[ProjectPlan, FactoryEquipment]:
    """
    설비 추천과 생산 계획 생성을 한 번에 처리하는 유틸 함수.
    
    1. quantity × product_avg_production_time 으로 필요한 생산 시간을 계산
    2. recommend_equipment 를 사용해 가장 빨리 시작할 수 있는 설비와 시작 시각(5분 단위)을 추천
    3. 추천된 설비와 시작 시각을 사용해 create_production_plan 으로 ProjectPlan 생성
    4. additional_plans_by_equipment 이 주어지면, 이번 배치의 임시 plan 으로 바로 반영
    
    Returns:
        (생성된 ProjectPlan, 사용된 FactoryEquipment)
    """
    # 제품 평균 생산 시간 결정
    if product_avg_production_time is None:
        product = await sync_to_async(lambda: quotation_product.product)()
        product_avg_production_time = product.average_production_time or 30
    else:
        # None 이 아니지만 0 이나 falsy 인 경우도 기본값 보정
        if not product_avg_production_time:
            product_avg_production_time = 30

    # 설비 추천
    result = await recommend_equipment(
        factory_id=factory_id,
        quantity=quantity,
        avg_production_time=product_avg_production_time,
        additional_plans_by_equipment=additional_plans_by_equipment,
    )
    if not result:
        raise HttpError(400, "해당 공장에 가동 가능한 설비가 없습니다.")

    equipment, recommended_start_date = result

    # 생산 계획 생성
    project_plan = await create_production_plan(
        project=project,
        quotation_product=quotation_product,
        equipment=equipment,
        quantity=quantity,
        product_avg_production_time=product_avg_production_time,
        status=status,
        defective_quantity=defective_quantity,
        start_date=recommended_start_date,
        save=save,
    )

    # 이번 배치용 임시 plan 목록에 바로 반영 (여러 개의 plan 을 한 번에 잡는 배치에서 사용)
    if additional_plans_by_equipment is not None:
        additional_plans_by_equipment.setdefault(equipment.id, []).append(project_plan)

    return project_plan, equipment


async def consume_raw_materials(product, amount: int):
    """원자재 소모 처리"""

    @sync_to_async
    def consume_materials():
        material_products = MaterialProduct.objects.filter(product=product)
        for material_product in material_products:
            material = material_product.material
            required_quantity = material_product.quantity * amount

            if material.current_stock < required_quantity:
                raise HttpError(
                    400,
                    f"원자재 {material.name}의 재고가 부족합니다. 필요: {required_quantity}, 보유: {material.current_stock}",
                )

            material.current_stock -= required_quantity
            material.save()

    await consume_materials()


async def check_material_availability(product_id: int, required_quantity: int) -> str:
    """
    제품 생산을 위한 원자재 수량 충분성을 확인합니다.

    Args:
        product_id: 제품 ID
        required_quantity: 생산할 제품 수량

    Returns:
        str: "충분", "위험", 또는 "부족"
        - "부족": 하나라도 부족한 원자재가 있는 경우
        - "위험": 부족은 없지만 하나라도 위험 상태인 원자재가 있는 경우
        - "충분": 모든 원자재가 충분한 경우
    """
    from stock.utils import get_material_status

    @sync_to_async
    def check_materials():
        # 해당 제품에 필요한 모든 원자재 조회
        material_products = MaterialProduct.objects.filter(
            product_id=product_id
        ).select_related("material")

        if not material_products.exists():
            # 원자재가 필요하지 않은 제품인 경우
            return "충분"

        # 각 원자재별로 상태 확인
        material_statuses = []
        
        for material_product in material_products:
            material = material_product.material
            
            # 필요 수량 계산 (주석처리: 투입될 양은 고려하지 않음)
            # required_material_quantity = (
            #     float(material_product.quantity) * required_quantity
            # )
            #
            # 필요한 수량보다 현재 재고가 적으면 부족 (주석처리)
            # if material.current_stock is None or material.current_stock < required_material_quantity:
            #     material_statuses.append("부족")
            #     continue
            
            # 원자재 상태 확인 (get_material_status 사용)
            # 현재 재고 상태만 확인 (필요 수량은 고려하지 않음)
            status = get_material_status(
                current_stock=material.current_stock,
                max_stock=material.max_stock,
                rop=material.rop,
                standard_stock=material.standard_stock,
            )
            
            # 상태가 None이거나 판단 불가능한 경우는 "충분"으로 처리
            if status is None:
                material_statuses.append("충분")
            elif status == "부족":
                # get_material_status가 "부족"을 반환한 경우
                material_statuses.append("부족")
            elif status == "위험":
                material_statuses.append("위험")
            else:
                # "충분" 또는 "과재고" 등은 "충분"으로 처리
                material_statuses.append("충분")

        # 우선순위: 부족 > 위험 > 충분
        # 1. 하나라도 "부족" 상태인 경우
        if "부족" in material_statuses:
                return "부족"

        # 2. "부족"은 없는데 "위험"이 하나라도 있는 경우
        if "위험" in material_statuses:
            return "위험"
        
        # 3. 그 외에는 "충분"
        return "충분"

    return await check_materials()


def calculate_plan_schedule(
    quantity: int,
    avg_production_time: Optional[int],
    start: Optional[datetime] = None,
) -> Tuple[datetime, datetime, int, int]:
    """
    공통 생산 계획 시간 계산 함수.

    Args:
        quantity: 생산 수량
        avg_production_time: 제품별 평균 생산 시간(초)
        start: 시작 시각(없으면 timezone.now())

    Returns:
        (start_datetime, end_datetime, resolved_avg_time, total_seconds)
    """

    if quantity < 0:
        raise ValueError("quantity must be non-negative")

    resolved_avg = avg_production_time or 30  # 기본값 30초
    start_dt = start or timezone.now()
    total_seconds = resolved_avg * quantity
    end_dt = start_dt + timedelta(seconds=total_seconds)

    return start_dt, end_dt, resolved_avg, total_seconds


async def create_production_plan(
    project: Project,
    quotation_product: "QuotationProduct",
    equipment: FactoryEquipment,
    quantity: int,
    product_avg_production_time: Optional[int] = None,
    status: str = ProjectPlan.ProductionStatus.pending,
    defective_quantity: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    save: bool = True,
) -> ProjectPlan:
    """
    생산 계획을 생성하는 공통 함수.
    
    Args:
        project: 프로젝트 객체
        quotation_product: 견적서 품목 객체
        equipment: 설비 객체
        quantity: 생산 수량
        product_avg_production_time: 제품의 평균 생산 시간(초). None이면 제품의 average_production_time 사용
        status: 생산 계획 상태 (기본값: pending)
        defective_quantity: 불량품 수량 (선택)
        start_date: 생산 시작 일시. None이면 현재 시간 사용
        end_date: 생산 종료 일시. None이면 calculate_plan_schedule로 계산
        save: DB에 저장할지 여부 (기본값: True). False이면 객체만 생성하고 저장하지 않음
    
    Returns:
        생성된 ProjectPlan 객체 (save=False인 경우 저장되지 않은 객체)
    """
    
    # 제품의 평균 생산 시간 가져오기
    if product_avg_production_time is None:
        product = await sync_to_async(lambda: quotation_product.product)()
        product_avg_production_time = product.average_production_time
    
    # 생산 일정 계산 (end_date가 제공되지 않은 경우에만 계산)
    if end_date is None:
        start_datetime, end_datetime, _, _ = calculate_plan_schedule(
            quantity, product_avg_production_time, start=start_date
        )
    else:
        # 사용자가 입력한 start_date와 end_date 사용
        start_datetime = start_date or timezone.now()
        end_datetime = end_date
    
    # 생산 계획 생성
    if save:
        plan = await ProjectPlan.objects.acreate(
            project=project,
            product=quotation_product,
            equipment=equipment,
            quantity=quantity,
            defective_quantity=defective_quantity,
            start_date=start_datetime,
            end_date=end_datetime,
            avg_production_time=product_avg_production_time,
            status=status,
        )
    else:
        # 저장하지 않고 객체만 생성 (나중에 저장할 경우)
        plan = ProjectPlan(
            project=project,
            product=quotation_product,
            equipment=equipment,
            quantity=quantity,
            defective_quantity=defective_quantity,
            start_date=start_datetime,
            end_date=end_datetime,
            avg_production_time=product_avg_production_time,
            status=status,
        )
    
    return plan


def update_product_avg_production_time_from_recent_plans(product_id: int):
    """
    해당 제품의 최근 50개 완료된 생산계획을 기반으로 제품의 평균 생산 시간을 업데이트합니다.

    Args:
        product_id: 제품 ID
    
    성능 최적화:
    - DB에서 최근 50개만 조회 (LIMIT 사용)
    - 필요한 필드만 선택 (values 사용)
    - 동시 호출 시 중복 계산 방지 (select_for_update 사용)
    """
    from django.db import transaction
    
    # 트랜잭션 내에서 실행하여 동시성 문제 방지
    with transaction.atomic():
        # 해당 제품의 최근 50개 완료된 생산계획 조회
        # values()를 사용하여 필요한 필드만 가져오고, DB 레벨에서 LIMIT 적용
        completed_plans = list(
            ProjectPlan.objects.filter(
                product__product_id=product_id,
                status=ProjectPlan.ProductionStatus.completed,
                start_date__isnull=False,
                end_date__isnull=False,
                quantity__gt=0,
            )
            .order_by("-end_date")  # 최근 완료된 순서대로
            .values("start_date", "end_date", "quantity")[:50]  # DB에서 50개만 가져옴
        )

        if not completed_plans:
            # 완료된 생산계획이 없으면 업데이트하지 않음
            return

        total_production_time = 0  # 총 생산 시간 (초)
        total_quantity = 0  # 총 생산 수량

        for plan in completed_plans:
            start_date = plan["start_date"]
            end_date = plan["end_date"]
            quantity = plan["quantity"]
            
            if start_date and end_date and quantity > 0:
                # 각 계획의 생산 시간 계산
                plan_duration = (end_date - start_date).total_seconds()
                if plan_duration > 0:
                    total_production_time += plan_duration
                    total_quantity += quantity

        # 평균 생산 시간 계산
        if total_quantity > 0 and total_production_time > 0:
            avg_production_time = int(total_production_time / total_quantity)
            
            # 제품의 average_production_time 업데이트 (select_for_update로 동시성 보장)
            try:
                product = Product.objects.select_for_update().get(id=product_id)
                product.average_production_time = avg_production_time
                product.save(update_fields=["average_production_time"])
            except Product.DoesNotExist:
                pass

