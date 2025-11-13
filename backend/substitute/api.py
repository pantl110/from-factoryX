from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from substitute.schemas.inbound import SubstituteIn
from substitute.schemas.outbound import (
    SubstituteDetailOut,
    MaterialSimpleOut,
)
from substitute.models import Substitute
from stock.models import Material
from factory.utils import is_factory_member, get_factory_by_id
from typing import List
from substitute.utils import get_substitute_by_id


router = Router(tags=["Substitute"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 대체 자재 관계 생성 (단방향)",
    description="source_material의 대체 가능한 자재들을 정의합니다.",
    response={201: SubstituteDetailOut, 400: dict, 404: dict},
)
async def create_substitute(request, payload: SubstituteIn, factory_id: int = None):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    factory = await get_factory_by_id(int(factory_id))

    # target_materials 검증
    if not payload.target_materials:
        raise HttpError(400, "최소 1개 이상의 대체 자재를 선택해야 합니다.")

    @sync_to_async
    def create_substitute_relation():
        # source_material 확인
        if not payload.source_material_id:
            raise HttpError(400, "source_material_id는 필수입니다.")
        
        try:
            source_material = Material.objects.get(
                id=payload.source_material_id, factory_id=factory.id
            )
        except Material.DoesNotExist:
            raise HttpError(
                404, "원본 자재가 존재하지 않거나 해당 공장에 속하지 않습니다."
            )

        # 이미 해당 source_material에 대한 관계가 있는지 확인
        if Substitute.objects.filter(
            factory_id=factory.id, source_material_id=payload.source_material_id
        ).exists():
            raise HttpError(
                400,
                f"자재 ID {payload.source_material_id}에 대한 대체 자재 관계가 이미 존재합니다. 기존 관계를 삭제한 후 다시 생성하세요.",
            )

        # target_materials 확인
        target_materials = Material.objects.filter(
            id__in=payload.target_materials, factory_id=factory.id
        )

        if target_materials.count() != len(payload.target_materials):
            raise HttpError(
                400, "일부 대체 자재가 존재하지 않거나 해당 공장에 속하지 않습니다."
            )

        # source_material이 target_materials에 포함되지 않아야 함
        if payload.source_material_id in payload.target_materials:
            raise HttpError(400, "원본 자재는 대체 자재 목록에 포함될 수 없습니다.")

        # Substitute 관계 생성
        substitute = Substitute.objects.create(
            factory=factory,
            source_material=source_material,
        )

        # M2M 관계 설정 (단방향)
        substitute.target_materials.set(target_materials)

        return substitute

    substitute = await create_substitute_relation()

    substitute = await get_substitute_by_id(factory_id, substitute.id)

    return 201, substitute


@router.get(
    "/{material_id}",
    summary="[R] 자재의 대체 가능한 자재 조회 (단방향)",
    description="특정 자재(source_material)의 대체 가능한 자재들을 조회합니다. target_materials가 페이지네이션됩니다.",
    response={200: List[MaterialSimpleOut], 400: dict, 404: dict},
)
@paginate
async def get_substitutes_by_material(
    request, material_id: int, factory_id: int = None
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    @sync_to_async
    def get_material():
        try:
            material = Material.objects.get(id=material_id, factory_id=factory_id)
            return material
        except Material.DoesNotExist:
            raise HttpError(404, "자재를 찾을 수 없습니다.")

    material = await get_material()

    @sync_to_async
    def get_target_materials():
        # 해당 자재가 source_material인 대체 자재 관계를 조회 (단방향)
        substitute = Substitute.objects.filter(
            source_material=material, factory_id=factory_id
        ).first()

        if not substitute:
            # 대체 자재 관계가 없으면 빈 쿼리셋 반환
            return Material.objects.none()

        # target_materials를 QuerySet으로 반환 (페이지네이션을 위해)
        return substitute.target_materials.all()

    target_materials = await get_target_materials()

    return target_materials


@router.delete(
    "/relation/{substitute_id}",
    summary="[D] 대체 자재 관계 삭제",
    description="특정 대체 자재 관계를 삭제합니다.",
    response={200: dict, 400: dict, 404: dict},
)
async def delete_substitute(request, substitute_id: int, factory_id: int = None):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    substitute = await get_substitute_by_id(factory_id, substitute_id)

    await substitute.adelete()

    return 200, {
        "message": "대체 자재 관계가 삭제되었습니다.",
        "deleted_substitute_id": substitute_id,
    }
