from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from django.db import IntegrityError
from django.db.models import F
from api.security import jwt_auth
from typing import List

from stock.models import Material, MaterialProduct, Product
from stock.schemas.inbound import (
    MaterialUpdateIn,
    AssignMaterialIn,
    SingleMaterialCreateIn,
)
from stock.schemas.outbound import (
    MaterialDetailModelOut,
    AssignMaterialOut,
    MaterialSummaryOut,
    ShortageMaterialCountOut,
    ExpiryRiskMaterialOut,
)
from stock.utils import get_material_status, get_expiry_status
from factory.models import Factory
from substitute.models import Substitute

from factory.utils import is_factory_member


router = Router(tags=["Material"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 원자재 생성",
    description="공장에 연결된 원자재를 생성합니다. 하나 또는 여러 개를 한 번에 생성할 수 있습니다.",
    response={201: dict},
    auth=jwt_auth,
)
async def create_materials(request, payload: List[SingleMaterialCreateIn]):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=int(factory_id))
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장을 찾을 수 없습니다.")

    # 기존 코드와 중복 체크
    codes = [item.code for item in payload]
    existing_codes = await sync_to_async(list)(
        Material.objects.filter(factory=factory, code__in=codes).values_list(
            "code", flat=True
        )
    )

    material_ids = []
    has_duplicates = False
    processed_codes = set()  # 이미 처리한 코드들을 추적

    for item in payload:
        data = item.dict()
        code = data["code"]

        # 요청 내 중복 코드 체크 (이미 처리한 코드인지 확인)
        if code in processed_codes:
            has_duplicates = True
            continue

        # 기존 코드와 중복 체크
        if code in existing_codes:
            has_duplicates = True
            continue

        # 기본값 설정
        if "unit" not in data or data["unit"] is None:
            data["unit"] = "EA"
        # expiry_days가 없거나 None이면 기본값 7 설정
        if "expiry_days" not in data or data.get("expiry_days") is None:
            data["expiry_days"] = 7
        # current_stock과 standard_stock, rop, max_stock, memo는 None이면 제거 (모델의 기본값 사용)
        if data.get("current_stock") is None:
            data.pop("current_stock", None)
        if data.get("standard_stock") is None:
            data.pop("standard_stock", None)
        if data.get("rop") is None:
            data.pop("rop", None)
        if data.get("max_stock") is None:
            data.pop("max_stock", None)
        if data.get("memo") is None:
            data.pop("memo", None)

        try:
            material = await Material.objects.acreate(factory=factory, **data)
            material_ids.append(material.id)
            processed_codes.add(code)  # 성공적으로 처리된 코드 추가
        except IntegrityError:
            has_duplicates = True

    # 메시지 생성
    message = f"{len(material_ids)}개의 원자재가 성공적으로 생성되었습니다."
    if has_duplicates:
        message += " 중복된 코드가 있었습니다."

    return 201, {
        "material_ids": material_ids,
        "message": message,
    }


# Onboarding
@router.post(
    "/assign",
    summary="[C] 원자재 생성 및 품목 연결",
    description="원자재들을 생성, 있다면 기존 원자재를 품목과 연결합니다.",
    response={201: AssignMaterialOut},
    auth=jwt_auth,
)
async def assign_material(request, payload: AssignMaterialIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    data = payload.dict()
    factory_id = int(factory_id)
    product_id = data["product_id"]
    materials_data = data["materials"]

    codes = [m["code"] for m in materials_data]
    if len(codes) != len(set(codes)):
        raise HttpError(400, "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")

    try:
        factory = await Factory.objects.aget(id=factory_id)
    except Factory.DoesNotExist:
        raise HttpError(404, "공장 정보를 찾을 수 없습니다.")

    try:
        product = await Product.objects.select_related("factory").aget(
            id=product_id, factory_id=int(factory_id)
        )
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품이 존재하지 않습니다.")

    material_ids = []
    material_codes = []
    try:
        for material_info in materials_data:
            material, created = await Material.objects.aget_or_create(
                factory=factory,
                code=material_info["code"],
                defaults={
                    "name": material_info["name"],
                    "spec": material_info["spec"],
                    "unit": "EA",
                    "current_stock": 0,
                    "standard_stock": 0,
                },
            )
            material_ids.append(material.id)
            material_codes.append(material.code)

            material_product, created = await MaterialProduct.objects.aget_or_create(
                product=product,
                material=material,
                defaults={"quantity": material_info["quantity"]},
            )
            if not created:
                material_product.quantity = material_info["quantity"]
                await material_product.asave()

        return 201, AssignMaterialOut(
            material_ids=material_ids,
            material_codes=material_codes,
            message="원자재가 성공적으로 생성 및 연결되었습니다.",
        )
    except IntegrityError:
        raise HttpError(400, "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")


# Material Tab
@router.get(
    "",
    summary="[C] 공장별 원자재 목록 조회",
    description="특정 공장의 모든 원자재 정보를 조회합니다. material_id가 제공되면 해당 자재와 연결된 대체자재들을 제외합니다.",
    response={200: List[MaterialSummaryOut], 404: dict, 500: dict},
)
@paginate
async def get_materials_by_factory(
    request,
    q: str = None,
    order: str = "desc",
    material_id: int = None,
    status: str = None,
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=factory_id)
    except Factory.DoesNotExist:
        raise HttpError(404, "공장 정보를 찾을 수 없습니다.")

    @sync_to_async
    def get_materials():
        queryset = Material.objects.filter(factory=factory)
        
        # material_id가 제공되면 해당 자재와 연결된 대체자재들 제외, 자기 자신도 제외
        if material_id:
            # 해당 material_id가 source_material인 Substitute 관계 찾기
            substitute_relation = Substitute.objects.filter(
                factory_id=factory_id, source_material_id=material_id
            ).first()
            
            if substitute_relation:
                # target_materials로 연결된 자재 ID 목록 가져오기
                target_material_ids = list(
                    substitute_relation.target_materials.values_list("id", flat=True)
                )
                # 대체자재로 연결된 자재들 제외
                queryset = queryset.exclude(id__in=target_material_ids)
            # material_id 자체도 제외 (자기 자신은 대체자재 목록에 포함될 수 없음)
            queryset = queryset.exclude(id=material_id)
        
        if status == "shortage":
            queryset = queryset.filter(current_stock__lt=F("standard_stock"))

        if q:
            qs1 = queryset.filter(name__icontains=q)
            qs2 = queryset.filter(code__icontains=q)
            ids = set(
                list(qs1.values_list("id", flat=True))
                + list(qs2.values_list("id", flat=True))
            )
            queryset = queryset.filter(id__in=ids)
        if order == "asc":
            queryset = queryset.order_by("current_stock")
        else:
            queryset = queryset.order_by("-current_stock")
        return list(queryset)

    materials = await get_materials()

    material_list = []
    for material in materials:
        # 자재 상태 판단
        material_status = get_material_status(
            current_stock=material.current_stock,
            max_stock=material.max_stock,
            rop=material.rop,
            standard_stock=material.standard_stock,
        )
        
        # 유통기한 상태 계산
        expiry_days = material.expiry_days or 7  # 기본값 7일
        expiry_status = await sync_to_async(get_expiry_status)(material.id, expiry_days)
        
        material_list.append(
            {
                "id": material.id,
                "name": material.name,
                "code": material.code,
                "spec": material.spec,
                "unit": material.unit,
                "current_stock": material.current_stock,
                "status": material_status,
                "expiry_status": expiry_status,
            }
        )

    return material_list


@router.get(
    "/expiry-risk",
    summary="[C] 유통기한 위험 원자재 목록 조회",
    description="유통기한이 위험 상태인 원자재 목록을 조회합니다. expiry_status가 '위험'인 원자재만 반환합니다.",
    response={200: List[ExpiryRiskMaterialOut], 404: dict, 500: dict},
)
@paginate
async def get_expiry_risk_materials(request, q: str = None):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=factory_id)
    except Factory.DoesNotExist:
        raise HttpError(404, "공장 정보를 찾을 수 없습니다.")

    @sync_to_async
    def get_risk_materials():
        # 모든 원자재 조회
        materials = Material.objects.filter(factory=factory)
        risk_materials = []
        
        for material in materials:
            # 유통기한 상태 계산
            expiry_days = material.expiry_days or 7  # 기본값 7일
            expiry_status = get_expiry_status(material.id, expiry_days)
            
            # 위험 상태인 것만 필터링
            if expiry_status == "위험":
                # 스키마로 변환하여 반환
                risk_materials.append(
                    ExpiryRiskMaterialOut(
                        id=material.id,
                        name=material.name,
                        unit=material.unit,
                        current_stock=material.current_stock,
                        rop=material.rop,
                        expiry_status=expiry_status,
                    )
                )
        
        return risk_materials

    risk_materials = await get_risk_materials()
    return risk_materials


@router.get(
    "/shortage",
    summary="[C] 부족한 원자재 수 조회",
    description="현재 재고가 안전 재고보다 적은 원자재의 개수를 조회합니다.",
    response={200: ShortageMaterialCountOut, 404: dict, 500: dict},
)
async def get_insufficient_material_count(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:

        @sync_to_async
        def get_shortage_count():
            # 전체 원자재 수
            total_materials = Material.objects.filter(
                factory_id=int(factory_id)
            ).count()

            # 부족한 원자재 수 (현재 재고 < 안전 재고)
            shortage_count = Material.objects.filter(
                factory_id=int(factory_id), current_stock__lt=F("standard_stock")
            ).count()

            # 부족 비율 계산
            shortage_percentage = (
                (shortage_count / total_materials * 100) if total_materials > 0 else 0
            )

            return {
                "shortage_count": shortage_count,
                "total_materials": total_materials,
                "shortage_percentage": round(shortage_percentage, 2),
            }

        result = await get_shortage_count()
        return 200, ShortageMaterialCountOut(**result)

    except Exception as e:
        raise HttpError(500, f"부족한 원자재 수 조회 중 오류가 발생했습니다: {str(e)}")


# Material Tab
@router.get(
    "{material_id}",
    summary="[C] 원자재 상세 조회",
    description="특정 원자재의 상세 정보를 조회합니다.",
    response={200: MaterialDetailModelOut, 404: dict, 500: dict},
)
async def get_material_detail(request, material_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    # 유통기한 상태 계산
    expiry_days = material.expiry_days or 7  # 기본값 7일
    expiry_status = await sync_to_async(get_expiry_status)(material.id, expiry_days)
    
    # MaterialDetailModelOut으로 변환하면서 expiry_status 추가
    material_detail = MaterialDetailModelOut.model_validate(material)
    material_detail.expiry_status = expiry_status
    
    return material_detail


# Material Tab
@router.patch(
    "{material_id}",
    summary="[C] 원자재 수정",
    description="특정 원자재의 정보를 수정합니다.",
    response={200: MaterialDetailModelOut, 400: dict, 404: dict, 500: dict},
)
async def update_material(request, material_id: int, payload: MaterialUpdateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    update_data = payload.dict(exclude_unset=True)

    # expiry_days가 None이면 7로 설정
    if "expiry_days" in update_data and update_data.get("expiry_days") is None:
        update_data["expiry_days"] = 7
    
    # current_stock이 None이면 0으로 설정
    if "current_stock" in update_data and update_data.get("current_stock") is None:
        update_data["current_stock"] = 0

    nullable_fields = ["standard_stock", "rop", "max_stock", "memo", "expiry_days"]
    blank_fields = []
    for field, value in update_data.items():
        if field not in nullable_fields and value in [None, ""]:
            blank_fields.append(field)

    if blank_fields:
        raise HttpError(400, f"공란 또는 null 불가: {', '.join(blank_fields)}")

    if "code" in update_data and update_data["code"] != material.code:
        try:
            existing_material = await Material.objects.aget(
                factory_id=material.factory_id, code=update_data["code"]
            )
            raise HttpError(400, "이미 존재하는 자재코드입니다.")
        except Material.DoesNotExist:
            pass

    for key, value in update_data.items():
        setattr(material, key, value)
    await sync_to_async(material.save)()

    return material


@router.delete(
    "{material_id}",
    summary="[C] 원자재 삭제",
    description="특정 원자재를 삭제합니다.",
    response={200: dict, 404: dict, 500: dict},
)
async def delete_material(request, material_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    await sync_to_async(material.delete)()

    return 200, {"message": "원자재가 성공적으로 삭제되었습니다."}
