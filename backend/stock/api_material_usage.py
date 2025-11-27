from decimal import Decimal
from ninja import Router, Query
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from typing import List, Optional
from django.db import transaction
from stock.models import MaterialUsage
from stock.schemas.outbound import MaterialUsageOut
from stock.material_usage_utils import (
    build_material_usage_out,
    check_plan_permission,
    restore_lot_allocation,
    apply_lot_allocation,
    reallocate_lot_on_update,
)
from stock.schemas.inbound import MaterialUsageIn
from stock.models import Material, MaterialHistory
from repackaging.models import MaterialRepackaging
from factory.utils import is_factory_member

router = Router(tags=["MaterialUsage"], auth=jwt_auth)


@router.post(
    "",
    summary="[C/U] 프로젝트 플랜 자재 사용 내역 생성 또는 수정",
    description="id가 있으면 수정하고, 없으면 생성합니다. 여러 개를 한 번에 처리할 수 있습니다.",
    response={200: List[MaterialUsageOut], 201: List[MaterialUsageOut], 400: dict, 404: dict, 500: dict},
)
async def create_or_update_plan_material_usage(
    request, payload: List[MaterialUsageIn]
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        @sync_to_async
        def process_usages():
            results = []
            has_updates = False

            with transaction.atomic():
                for item in payload:
                    # 각 item마다 plan/usage 결정
                    plan = None
                    if item.id:
                        # Update 모드
                        has_updates = True
                        try:
                            usage = (
                                MaterialUsage.objects.select_related(
                                    "plan",
                                    "material",
                                    "original_material",
                                    "material_history",
                                    "material_repackaging",
                                )
                                .select_for_update()
                                .get(id=item.id)
                            )
                        except MaterialUsage.DoesNotExist:
                            raise HttpError(404, f"자재 사용 내역 ID {item.id}를 찾을 수 없습니다.")

                        # payload에 plan_id가 있으면 일관성 체크
                        if item.plan_id is not None and item.plan_id != usage.plan_id:
                            raise HttpError(
                                400,
                                f"자재 사용 내역 ID {item.id}의 플랜 ID와 요청 플랜 ID가 일치하지 않습니다.",
                            )

                        # 권한 검증용 plan
                        plan = check_plan_permission(usage.plan_id, int(factory_id))

                        prev_history = usage.material_history
                        prev_repackaging = usage.material_repackaging
                        prev_amount = usage.usage_amount

                        # Material 변경
                        if item.material_id:
                            try:
                                material = Material.objects.get(
                                    id=item.material_id, factory_id=int(factory_id)
                                )
                                usage.material = material
                            except Material.DoesNotExist:
                                raise HttpError(404, f"자재 ID {item.material_id}를 찾을 수 없습니다.")

                        # Original Material 변경
                        if item.original_material_id is not None:
                            if item.original_material_id == 0:
                                usage.original_material = None
                            else:
                                try:
                                    original_material = Material.objects.get(
                                        id=item.original_material_id, factory_id=int(factory_id)
                                    )
                                    usage.original_material = original_material
                                except Material.DoesNotExist:
                                    raise HttpError(
                                        404, f"원래 자재 ID {item.original_material_id}를 찾을 수 없습니다."
                                    )

                        # Usage amount 변경
                        if item.usage_amount is not None:
                            if item.usage_amount <= 0:
                                raise HttpError(400, "사용량은 0보다 커야 합니다.")
                            usage.usage_amount = item.usage_amount

                        # MaterialHistory 변경
                        if item.material_history_id is not None:
                            if item.material_history_id == 0:
                                usage.material_history = None
                                usage.material_repackaging = None
                            else:
                                try:
                                    material_history = MaterialHistory.objects.get(
                                        id=item.material_history_id,
                                        material_id=usage.material.id,
                                    )
                                except MaterialHistory.DoesNotExist:
                                    raise HttpError(
                                        404, f"자재 이력 ID {item.material_history_id}를 찾을 수 없습니다."
                                    )
                                usage.material_history = material_history
                                usage.material_repackaging = None

                        # MaterialRepackaging 변경
                        if item.material_repackaging_id is not None:
                            if item.material_repackaging_id == 0:
                                usage.material_repackaging = None
                                usage.material_history = None
                            else:
                                if usage.material_history:
                                    raise HttpError(
                                        400,
                                        "MaterialHistory와 MaterialRepackaging은 동시에 설정할 수 없습니다.",
                                    )
                                try:
                                    material_repackaging = MaterialRepackaging.objects.select_related(
                                        "parent_history__material"
                                    ).get(id=item.material_repackaging_id)
                                except MaterialRepackaging.DoesNotExist:
                                    raise HttpError(
                                        404,
                                        f"자재 소분 내역 ID {item.material_repackaging_id}를 찾을 수 없습니다.",
                                    )
                                parent_material_id = (
                                    material_repackaging.parent_history.material_id
                                    if material_repackaging.parent_history
                                    else None
                                )
                                if parent_material_id != usage.material.id:
                                    raise HttpError(
                                        400,
                                        "선택한 소분 LOT이 자재와 일치하지 않습니다.",
                                    )
                                usage.material_repackaging = material_repackaging
                                usage.material_history = None

                        usage.save()

                        reallocate_lot_on_update(
                            prev_history,
                            prev_repackaging,
                            prev_amount,
                            usage.material_history,
                            usage.material_repackaging,
                            usage.usage_amount,
                        )

                    else:
                        # Create 모드
                        if not item.plan_id:
                            raise HttpError(400, "생성 시 plan_id는 필수입니다.")
                        if not item.material_id:
                            raise HttpError(400, "생성 시 material_id는 필수입니다.")
                        if item.usage_amount is None:
                            raise HttpError(400, "생성 시 usage_amount는 필수입니다.")

                        # 권한 검증 및 plan 조회
                        plan = check_plan_permission(item.plan_id, int(factory_id))

                        # Material 존재 확인
                        try:
                            material = Material.objects.get(
                                id=item.material_id, factory_id=int(factory_id)
                            )
                        except Material.DoesNotExist:
                            raise HttpError(404, f"자재 ID {item.material_id}를 찾을 수 없습니다.")

                        # Original Material 확인
                        original_material = None
                        if item.original_material_id:
                            try:
                                original_material = Material.objects.get(
                                    id=item.original_material_id, factory_id=int(factory_id)
                                )
                            except Material.DoesNotExist:
                                raise HttpError(
                                    404, f"원래 자재 ID {item.original_material_id}를 찾을 수 없습니다."
                                )

                        # MaterialHistory 또는 MaterialRepackaging 중 하나만 설정
                        material_history = None
                        material_repackaging = None

                        if item.material_history_id:
                            try:
                                material_history = MaterialHistory.objects.get(
                                    id=item.material_history_id, material_id=item.material_id
                                )
                            except MaterialHistory.DoesNotExist:
                                raise HttpError(
                                    404, f"자재 이력 ID {item.material_history_id}를 찾을 수 없습니다."
                                )

                        if item.material_repackaging_id:
                            if material_history:
                                raise HttpError(
                                    400,
                                    "MaterialHistory와 MaterialRepackaging은 동시에 설정할 수 없습니다.",
                                )
                            try:
                                material_repackaging = MaterialRepackaging.objects.select_related(
                                    "parent_history__material"
                                ).get(id=item.material_repackaging_id)
                            except MaterialRepackaging.DoesNotExist:
                                raise HttpError(
                                    404,
                                    f"자재 소분 내역 ID {item.material_repackaging_id}를 찾을 수 없습니다.",
                                )
                            parent_material_id = (
                                material_repackaging.parent_history.material_id
                                if material_repackaging.parent_history
                                else None
                            )
                            if parent_material_id != material.id:
                                raise HttpError(
                                    400,
                                    "선택한 소분 LOT이 자재와 일치하지 않습니다.",
                                )

                        # Usage amount 검증
                        if item.usage_amount <= 0:
                            raise HttpError(400, "사용량은 0보다 커야 합니다.")

                        usage = MaterialUsage.objects.create(
                            plan=plan,
                            material=material,
                            original_material=original_material,
                            usage_amount=item.usage_amount,
                            material_history=material_history,
                            material_repackaging=material_repackaging,
                        )

                        apply_lot_allocation(
                            material_history, material_repackaging, usage.usage_amount
                        )

                    # select_related로 다시 조회하여 관련 객체 로드
                    usage = (
                        MaterialUsage.objects.select_related(
                            "plan",
                            "material",
                            "original_material",
                            "material_history",
                            "material_repackaging",
                        )
                        .get(id=usage.id)
                    )

                    results.append(build_material_usage_out(usage))

            return results, has_updates

        usages, has_updates = await process_usages()
        status_code = 200 if has_updates else 201
        return status_code, usages

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(
            500, f"자재 사용 내역 생성 또는 수정 중 오류가 발생했습니다: {str(e)}"
        )


@router.get(
    "",
    summary="[R] 자재 사용 내역 조회",
    description="plan_id 또는 material_id로 필터링하여 자재 사용 내역을 조회합니다.",
    response={200: List[MaterialUsageOut], 404: dict, 500: dict},
)
async def list_material_usages(
    request,
    plan_id: Optional[int] = Query(
        None, description="프로젝트 플랜 ID (필터링용)"
    ),
    material_id: Optional[int] = Query(
        None, description="자재 ID (필터링용)"
    ),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    if plan_id is None and material_id is None:
        raise HttpError(400, "plan_id 또는 material_id 중 하나는 입력해야 합니다.")

    if plan_id is not None:
        await sync_to_async(check_plan_permission)(plan_id, int(factory_id))

    if material_id is not None:
        material_exists = await sync_to_async(
            Material.objects.filter(
                id=material_id, factory_id=int(factory_id)
            ).exists
        )()
        if not material_exists:
            raise HttpError(404, "해당 자재를 찾을 수 없습니다.")

    try:
        @sync_to_async
        def get_material_usages():
            usages = (
                MaterialUsage.objects.select_related(
                    "plan",
                    "material",
                    "original_material",
                    "material_history",
                    "material_repackaging",
                )
                .order_by("-created_at")
            )

            if plan_id is not None:
                usages = usages.filter(plan_id=plan_id)
            if material_id is not None:
                usages = usages.filter(material_id=material_id)

            return [build_material_usage_out(usage) for usage in usages]

        usages = await get_material_usages()
        return 200, usages

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"자재 사용 내역 조회 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/{usage_id}",
    summary="[D] 프로젝트 플랜 자재 사용 내역 삭제",
    description="usage_id로 자재 사용 내역을 삭제합니다.",
    response={204: dict, 404: dict, 500: dict},
)
async def delete_plan_material_usage(request, usage_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        @sync_to_async
        def delete_usage():
            with transaction.atomic():
                # Usage 존재 확인 및 연결된 플랜/프로젝트 권한 검증
                try:
                    usage = (
                        MaterialUsage.objects.select_related(
                            "plan__project",
                            "material_history",
                            "material_repackaging",
                        )
                        .select_for_update()
                        .get(id=usage_id)
                    )
                except MaterialUsage.DoesNotExist:
                    raise HttpError(404, "해당 자재 사용 내역을 찾을 수 없습니다.")

                # 연결된 플랜 기준으로 권한 검증
                check_plan_permission(usage.plan_id, int(factory_id))

                restore_lot_allocation(
                    usage.material_history, usage.material_repackaging, usage.usage_amount
                )

                usage.delete()

        await delete_usage()
        return 204, {}

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"자재 사용 내역 삭제 중 오류가 발생했습니다: {str(e)}")

