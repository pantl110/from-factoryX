from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from datetime import datetime, timedelta
from typing import Optional, Tuple, TYPE_CHECKING
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


async def get_default_equipment(factory_id: int) -> FactoryEquipment:
    """기본 장비 조회"""
    equipment = await sync_to_async(
        FactoryEquipment.objects.filter(factory_id=factory_id)
        .order_by("priority")
        .first
    )()
    if not equipment:
        raise HttpError(400, "사용 가능한 장비가 없습니다.")
    return equipment


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
        str: "충분" 또는 "부족"
    """

    @sync_to_async
    def check_materials():
        # 해당 제품에 필요한 모든 원자재 조회
        material_products = MaterialProduct.objects.filter(
            product_id=product_id
        ).select_related("material")

        if not material_products.exists():
            # 원자재가 필요하지 않은 제품인 경우
            return "충분"

        # 각 원자재별로 수량 충분성 확인
        for material_product in material_products:
            material = material_product.material
            required_material_quantity = (
                float(material_product.quantity) * required_quantity
            )

            # 현재 재고가 필요한 수량보다 적으면 "부족"
            if material.current_stock < required_material_quantity:
                return "부족"

        # 모든 원자재가 충분하면 "충분"
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

