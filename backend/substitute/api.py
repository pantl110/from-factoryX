from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from substitute.schemas.inbound import SubstituteIn, SubstituteUpdateIn
from substitute.schemas.outbound import (
    SubstituteListOut,
    SubstituteDetailOut,
    MaterialSimpleOut,
)
from substitute.models import Substitute
from stock.models import Material
from factory.utils import is_factory_member, get_factory_by_id
from typing import List
from substitute.utils import get_substitute_by_id
from django.db.models import Count


router = Router(tags=["Substitute"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 대체 자재 그룹 생성",
    description="factory_id에 대체 자재 그룹을 생성합니다.",
    response={201: SubstituteDetailOut, 400: dict, 404: dict},
)
async def create_substitute(request, payload: SubstituteIn, factory_id: int = None):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    factory = await get_factory_by_id(int(factory_id))

    # materials 검증
    if not payload.materials:
        raise HttpError(400, "최소 1개 이상의 자재를 선택해야 합니다.")

    @sync_to_async
    def create_substitute_group():
        # 자재가 해당 factory에 속하는지 확인
        materials = Material.objects.filter(
            id__in=payload.materials, factory_id=factory.id
        )

        if materials.count() != len(payload.materials):
            raise HttpError(
                400, "일부 자재가 존재하지 않거나 해당 공장에 속하지 않습니다."
            )

        # Substitute 그룹 생성
        substitute = Substitute.objects.create(
            factory=factory, **payload.dict(exclude={"materials"})
        )

        # M2M 관계 설정
        substitute.materials.set(materials)

        return substitute

    substitute = await create_substitute_group()

    substitute = await get_substitute_by_id(factory_id, substitute.id)

    return 201, substitute


@router.get(
    "",
    summary="[R] 대체 자재 그룹 목록 조회",
    description="factory_id에 속한 모든 대체 자재 그룹을 조회합니다.",
    response={200: List[SubstituteListOut], 400: dict},
)
async def list_substitutes(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    @sync_to_async
    def get_substitutes():
        substitutes = (
            Substitute.objects.filter(factory_id=factory_id)
            .select_related("factory")
            .prefetch_related("materials")
            .annotate(material_count=Count("materials"))
        )

        return list(substitutes)

    substitutes_list = await get_substitutes()

    return 200, substitutes_list


@router.get(
    "/{material_id}",
    summary="[R] 자재로 대체 자재 그룹 조회",
    description="특정 자재가 속한 대체 자재 그룹들을 조회합니다.",
    response={200: List[SubstituteDetailOut], 400: dict, 404: dict},
)
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
    def get_substitute_groups():
        # 해당 자재가 속한 모든 대체 자재 그룹을 조회
        substitutes = (
            Substitute.objects.filter(materials=material, factory_id=factory_id)
            .prefetch_related("materials")
            .select_related("factory")
        )
        return list(substitutes)

    substitutes_list = await get_substitute_groups()

    return 200, substitutes_list


@router.get(
    "/{substitute_id}",
    summary="[R] 대체 자재 그룹 상세 조회",
    description="특정 대체 자재 그룹의 상세 정보를 조회합니다.",
    response={200: SubstituteDetailOut, 400: dict, 404: dict},
)
async def get_substitute(request, substitute_id: int, factory_id: int = None):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    substitute = await get_substitute_by_id(factory_id, substitute_id)

    return substitute


@router.patch(
    "/{substitute_id}",
    summary="[U] 대체 자재 그룹 수정",
    description="특정 대체 자재 그룹의 정보를 수정합니다.",
    response={200: SubstituteDetailOut, 400: dict, 404: dict},
)
async def update_substitute(
    request, substitute_id: int, payload: SubstituteUpdateIn, factory_id: int = None
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    substitute = await get_substitute_by_id(factory_id, substitute_id)
    data = payload.dict(exclude_unset=True)

    @sync_to_async
    def update_substitute_group():
        materials_ids = data.pop("materials", None)

        # 필드 업데이트 (부분 수정 지원)
        for field, value in data.items():
            setattr(substitute, field, value)

        # materials가 제공된 경우 M2M 관계 업데이트
        if materials_ids is not None:
            if len(materials_ids) == 0:
                raise HttpError(400, "최소 1개 이상의 자재를 선택해야 합니다.")

            materials = Material.objects.filter(
                id__in=materials_ids, factory_id=factory_id
            )

            if materials.count() != len(materials_ids):
                raise HttpError(
                    400, "일부 자재가 존재하지 않거나 해당 공장에 속하지 않습니다."
                )

            substitute.materials.set(materials)

        substitute.save()

        return substitute

    substitute = await update_substitute_group()

    substitute = await get_substitute_by_id(factory_id, substitute_id)

    return substitute
@router.delete(
    "/{substitute_id}",
    summary="[D] 대체 자재 그룹 삭제",
    description="특정 대체 자재 그룹을 삭제합니다.",
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
        "message": "대체 자재 그룹이 삭제되었습니다.",
        "deleted_substitute_id": substitute_id,
    }
