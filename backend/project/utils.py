from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from datetime import datetime
from typing import Tuple
from project.models import Refund, Project, ProjectLog
from stock.models import MaterialProduct
from factory.models import FactoryEquipment


async def get_project_by_id(project_id):
    try:
        project = await Project.objects.select_related("tax_invoice").prefetch_related("quotations", "plans", "logs").aget(id=project_id)
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
        refund = await sync_to_async(Refund.objects.select_related("product").get)(
            id=refund_id
        )
    except Refund.DoesNotExist:
        raise HttpError(404, "해당 반품을 찾을 수 없습니다.")

    # refund_id로 ProjectLog를 찾아서 project 가져오기
    try:
        project_log = await sync_to_async(
            ProjectLog.objects.select_related("project").get
        )(refund=refund)
        project = project_log.project
    except ProjectLog.DoesNotExist:
        raise HttpError(404, "해당 반품과 연결된 프로젝트 로그를 찾을 수 없습니다.")

    # 팩토리 권한 확인
    quotation_exists = await sync_to_async(
        project.quotations.filter(factory_id=factory_id).exists
    )()
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
