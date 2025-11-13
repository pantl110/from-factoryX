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
    summary="[C] 대체 자재 관계 생성 또는 추가 (단방향)",
    description="source_material의 대체 가능한 자재들을 정의합니다. 이미 관계가 존재하면 기존 관계에 추가합니다.",
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

        # 이미 해당 source_material에 대한 관계가 있는지 확인
        substitute = Substitute.objects.filter(
            factory_id=factory.id, source_material_id=payload.source_material_id
        ).first()

        if substitute:
            # 기존 관계가 있으면 새로운 target_materials를 추가
            # 이미 존재하는 target_materials는 중복되지 않음 (ManyToMany의 특성)
            substitute.target_materials.add(*target_materials)
        else:
            # 관계가 없으면 새로 생성
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
    def get_substitute_and_materials():
        # 해당 자재가 source_material인 대체 자재 관계를 조회 (단방향)
        substitute = Substitute.objects.filter(
            source_material=material, factory_id=factory_id
        ).first()

        if not substitute:
            # 대체 자재 관계가 없으면 빈 리스트 반환
            return []

        # target_materials를 리스트로 반환 (페이지네이션을 위해)
        # 자기 자신(source_material)은 제외
        target_materials = list(substitute.target_materials.exclude(id=material_id))
        return target_materials

    target_materials = await get_substitute_and_materials()

    return target_materials


@router.delete(
    "/{material_id}",
    summary="[D] 대체 자재 관계에서 특정 대체 자재 제거",
    description="target_material_id를 필수로 받아 특정 target_material만 제거합니다.",
    response={200: dict, 400: dict, 404: dict},
)
async def delete_substitute(
    request, material_id: int, factory_id: int = None
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    target_material_id = request.GET.get("target_material_id")
    if not target_material_id:
        raise HttpError(400, "target_material_id를 입력해야 합니다.")

    try:
        target_material_id = int(target_material_id)
    except (ValueError, TypeError):
        raise HttpError(400, "target_material_id는 정수여야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    @sync_to_async
    def remove_target_material():
        # source_material 확인
        try:
            source_material = Material.objects.get(id=material_id, factory_id=factory_id)
        except Material.DoesNotExist:
            raise HttpError(404, "원본 자재를 찾을 수 없습니다.")

        # Substitute 관계 찾기 (unique_together로 하나만 존재)
        substitute = Substitute.objects.filter(
            factory_id=factory_id, source_material_id=material_id
        ).first()

        if not substitute:
            raise HttpError(404, "대체 자재 관계를 찾을 수 없습니다.")

        # target_material이 실제로 관계에 있는지 확인
        if not substitute.target_materials.filter(id=target_material_id).exists():
            raise HttpError(404, "해당 대체 자재가 관계에 존재하지 않습니다.")

        # 특정 target_material만 제거
        substitute.target_materials.remove(target_material_id)

        # target_materials가 비어있으면 Substitute 관계도 삭제
        if substitute.target_materials.count() == 0:
            substitute.delete()
            return {
                "message": "대체 자재가 모두 제거되어 관계가 삭제되었습니다.",
                "source_material_id": material_id,
                "removed_target_material_id": target_material_id,
            }

        return {
            "message": "대체 자재가 성공적으로 제거되었습니다.",
            "source_material_id": material_id,
            "removed_target_material_id": target_material_id,
        }

    result = await remove_target_material()
    return 200, result
