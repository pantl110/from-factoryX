from ninja import Router, Query, File
from django.shortcuts import get_object_or_404
from stock.models import Material, Factory, Product, MaterialProduct, MaterialHistory, ProductHistory
from stock.schemas.inbound import (
    MaterialCreateSchema, MaterialUpdateSchema, MaterialExcelUploadResponseSchema, 
    ProductMaterialConnectSchema, ProductCreateSchema, ProductUpdateSchema, ProductExcelUploadResponseSchema
)
from stock.schemas.outbound import (
    MaterialResponseSchema, MaterialListResponseSchema, MaterialSimpleSchema, 
    ProductMaterialRelationSchema, ProductMaterialRelationListSchema, ProductSimpleSchema,
    ProductResponseSchema, ProductListResponseSchema
)
from typing import List
from api.security import jwt_auth
from ninja.files import UploadedFile
from ninja.errors import HttpError
import pandas as pd
import tempfile, os
from datetime import datetime

router = Router(tags=["Stock"], auth=jwt_auth)

@router.post(
    "/materials",
    summary="[C] 자재 등록",
    description="새로운 자재를 등록합니다.",
    response=MaterialResponseSchema,
)
def create_material(request, payload: MaterialCreateSchema):
    factory = get_object_or_404(Factory, id=payload.factory_id)
    material = Material.objects.create(
        factory=factory,
        name=payload.name,
        code=payload.code,
        unit=payload.unit,
        spec=payload.spec,
        current_stock=payload.current_stock or 0,
        standard_stock=payload.standard_stock or 0,
    )
    return MaterialResponseSchema(
        id=material.id,
        factory_id=material.factory.id,
        name=material.name,
        code=material.code,
        unit=material.unit,
        spec=material.spec,
        current_stock=material.current_stock,
        standard_stock=material.standard_stock,
    )

@router.get(
    "/materials",
    summary="[R] 자재 목록 조회",
    description="등록된 모든 자재의 목록을 반환합니다.",
    response=MaterialListResponseSchema,
)
def list_materials(request):
    qs = Material.objects.all().order_by("name")
    materials = [
        MaterialResponseSchema(
            id=m.id,
            factory_id=m.factory.id,
            name=m.name,
            code=m.code,
            unit=m.unit,
            spec=m.spec,
            current_stock=m.current_stock,
            standard_stock=m.standard_stock,
        ) for m in qs
    ]
    return MaterialListResponseSchema(materials=materials, total_count=len(materials))

@router.get(
    "/materials/{material_id}",
    summary="[R] 자재 상세 조회",
    description="특정 자재의 상세 정보를 반환합니다.",
    response=MaterialResponseSchema,
)
def get_material(request, material_id: int):
    material = get_object_or_404(Material, id=material_id)
    return MaterialResponseSchema(
        id=material.id,
        factory_id=material.factory.id,
        name=material.name,
        code=material.code,
        unit=material.unit,
        spec=material.spec,
        current_stock=material.current_stock,
        standard_stock=material.standard_stock,
    )

@router.put(
    "/materials/{material_id}",
    summary="[U] 자재 정보 수정",
    description="자재의 정보를 수정합니다.",
    response=MaterialResponseSchema,
)
def update_material(request, material_id: int, payload: MaterialUpdateSchema):
    material = get_object_or_404(Material, id=material_id)
    
    # 필수 필드 검증
    errors = []
    if not payload.name:
        errors.append("자재명을 입력해주세요.")
    if not payload.code:
        errors.append("자재 코드를 입력해주세요.")
    if not payload.spec:
        errors.append("규격을 입력해주세요.")
    if not payload.unit:
        errors.append("단위를 입력해주세요.")
    if errors:
        raise HttpError(400, "일부 필수 항목이 비어 있습니다. " + " ".join(errors))
    
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(material, field, value)
    material.save()
    return MaterialResponseSchema(
        id=material.id,
        factory_id=material.factory.id,
        name=material.name,
        code=material.code,
        unit=material.unit,
        spec=material.spec,
        current_stock=material.current_stock,
        standard_stock=material.standard_stock,
    )

@router.delete(
    "/materials/{material_id}",
    summary="[D] 자재 삭제",
    description="특정 자재를 삭제합니다.",
)
def delete_material(request, material_id: int):
    material = get_object_or_404(Material, id=material_id)
    material.delete()
    return {"success": True, "message": "자재가 삭제되었습니다."}

@router.get(
    "/materials/search",
    summary="[R] 자재명 검색(자동완성)",
    description="자재명을 검색하여 자동완성용 목록을 반환합니다.",
    response=List[MaterialSimpleSchema],
)
def search_materials(request, query: str = Query(...)):
    qs = Material.objects.filter(name__icontains=query).order_by("name")[:10]
    return [MaterialSimpleSchema(id=m.id, name=m.name, code=m.code) for m in qs]

@router.get(
    "/materials/{material_id}/client-info",
    summary="[R] 자재 거래처 정보 조회",
    description="자재 코드를 기반으로 거래처명, 거래일자, 수량, 단가, 금액 정보를 반환합니다.",
)
def get_material_client_info(request, material_id: int):
    """자재의 거래처 정보를 조회합니다."""
    material = get_object_or_404(Material, id=material_id)
    histories = MaterialHistory.objects.filter(material=material).select_related('client').order_by('-created_at')
    
    client_info = []
    for history in histories:
        client_info.append({
            "거래처명": history.client.name,
            "거래일자": history.created_at.strftime("%Y-%m-%d"),
            "수량": history.quantity,
            "단가": history.price or 0,
            "금액": (history.price or 0) * history.quantity,
            "거래유형": history.type,
        })
    
    return {"success": True, "data": client_info}

@router.get(
    "/materials/{material_id}/connected-products",
    summary="[R] 자재 연결 품목 조회",
    description="자재 코드를 기반으로 연결된 품목명, 품목 코드, 규격, 단위를 반환합니다.",
)
def get_material_connected_products(request, material_id: int):
    """자재와 연결된 품목 정보를 조회합니다."""
    material = get_object_or_404(Material, id=material_id)
    relations = MaterialProduct.objects.filter(material=material).select_related('product')
    
    products = []
    for relation in relations:
        products.append({
            "품목명": relation.product.name,
            "품목코드": relation.product.code,
            "규격": relation.product.spec,
            "단위": relation.product.unit,
            "투입수량": float(relation.quantity),
        })
    
    return {"success": True, "data": products}

@router.get(
    "/materials/{material_id}/history",
    summary="[R] 자재 입출고 내역 조회",
    description="자재 코드를 기반으로 원자재 입출고 내역을 반환합니다.",
)
def get_material_history(request, material_id: int):
    """자재의 입출고 내역을 조회합니다."""
    material = get_object_or_404(Material, id=material_id)
    histories = MaterialHistory.objects.filter(material=material).select_related('client').order_by('-created_at')
    
    history_list = []
    for history in histories:
        history_list.append({
            "처리일자": history.created_at.strftime("%Y-%m-%d %H:%M"),
            "상태": history.type,
            "수량": history.quantity,
            "현재재고": history.total_stock,
            "거래처": history.client.name,
            "단가": history.price or 0,
        })
    
    return {"success": True, "data": history_list}

@router.post(
    "/materials/upload-excel",
    summary="[C] 엑셀로 자재 일괄 등록",
    description="엑셀 파일을 업로드하여 자재를 한 번에 등록합니다.",
    response=MaterialExcelUploadResponseSchema,
)
def upload_material_excel(request, file: UploadedFile = File(...)):
    """
    엑셀 파일로 자재를 일괄 등록합니다.
    """
    try:
        filename = file.name.lower()
        if not filename.endswith((".xlsx", ".xls")):
            return {"success": False, "message": "엑셀 파일만 지원합니다.", "data": None}

        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as temp_file:
            temp_file.write(file.read())
            temp_path = temp_file.name

        try:
            df = pd.read_excel(temp_path)
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

        materials = []
        for _, row in df.iterrows():
            try:
                factory_id = int(row.get("공장ID", 1))
                factory = Factory.objects.get(id=factory_id)
                material = Material.objects.create(
                    factory=factory,
                    name=row.get("자재명", ""),
                    code=row.get("자재코드", ""),
                    unit=row.get("단위", ""),
                    spec=row.get("규격", ""),
                    current_stock=int(row.get("현재재고", 0)),
                    standard_stock=int(row.get("안전재고", 0)),
                )
                materials.append({
                    "id": material.id,
                    "factory_id": material.factory.id,
                    "name": material.name,
                    "code": material.code,
                    "unit": material.unit,
                    "spec": material.spec,
                    "current_stock": material.current_stock,
                    "standard_stock": material.standard_stock,
                })
            except Exception as e:
                continue

        if not materials:
            return {"success": False, "message": "등록된 자재가 없습니다. 파일을 확인하세요.", "data": None}

        return {"success": True, "message": "엑셀 업로드 및 자재 등록 완료", "data": materials}

    except Exception as e:
        return {"success": False, "message": f"파일 처리 중 오류: {str(e)}", "data": None}

@router.post(
    "/products",
    summary="[C] 품목 등록",
    description="새로운 품목을 등록합니다.",
    response=ProductResponseSchema,
)
def create_product(request, payload: ProductCreateSchema):
    """새로운 품목을 등록합니다."""
    factory = get_object_or_404(Factory, id=payload.factory_id)
    
    product = Product.objects.create(
        factory=factory,
        name=payload.name,
        code=payload.code,
        spec=payload.spec,
        unit=payload.unit,
        current_stock=payload.current_stock or 0,
        average_production_time=payload.average_production_time,
        location=payload.location,
        note=payload.note,
    )
    
    return ProductResponseSchema(
        id=product.id,
        factory_id=product.factory.id,
        name=product.name,
        code=product.code,
        spec=product.spec,
        unit=product.unit,
        current_stock=product.current_stock,
        average_production_time=product.average_production_time,
        location=product.location,
        note=product.note,
    )

@router.get(
    "/products",
    summary="[R] 품목 목록 조회",
    description="등록된 모든 품목의 목록을 반환합니다.",
    response=ProductListResponseSchema,
)
def list_products(request):
    """품목 목록을 조회합니다."""
    qs = Product.objects.all().order_by("name")
    products = [
        ProductResponseSchema(
            id=p.id,
            factory_id=p.factory.id,
            name=p.name,
            code=p.code,
            spec=p.spec,
            unit=p.unit,
            current_stock=p.current_stock,
            average_production_time=p.average_production_time,
            location=p.location,
            note=p.note,
        ) for p in qs
    ]
    return ProductListResponseSchema(products=products, total_count=len(products))

@router.get(
    "/products/{product_id}",
    summary="[R] 품목 상세 조회",
    description="특정 품목의 상세 정보를 반환합니다.",
    response=ProductResponseSchema,
)
def get_product(request, product_id: int):
    """품목 상세 정보를 조회합니다."""
    product = get_object_or_404(Product, id=product_id)
    return ProductResponseSchema(
        id=product.id,
        factory_id=product.factory.id,
        name=product.name,
        code=product.code,
        spec=product.spec,
        unit=product.unit,
        current_stock=product.current_stock,
        average_production_time=product.average_production_time,
        location=product.location,
        note=product.note,
    )

@router.put(
    "/products/{product_id}",
    summary="[U] 품목 정보 수정",
    description="품목의 정보를 수정합니다.",
    response=ProductResponseSchema,
)
def update_product(request, product_id: int, payload: ProductUpdateSchema):
    """
    품목 정보를 수정합니다.
    """
    product = get_object_or_404(Product, id=product_id)
    errors = []
    if not payload.name:
        errors.append("품목명을 입력해주세요.")
    if not payload.code:
        errors.append("품목 코드를 입력해주세요.")
    if not payload.spec:
        errors.append("규격을 입력해주세요.")
    if not payload.unit:
        errors.append("단위를 입력해주세요.")
    if errors:
        raise HttpError(400, "일부 필수 항목이 비어 있습니다. " + " ".join(errors))
    
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(product, field, value)
    product.save()
    
    return ProductResponseSchema(
        id=product.id,
        factory_id=product.factory.id,
        name=product.name,
        code=product.code,
        spec=product.spec,
        unit=product.unit,
        current_stock=product.current_stock,
        average_production_time=product.average_production_time,
        location=product.location,
        note=product.note,
    )

@router.delete(
    "/products/{product_id}",
    summary="[D] 품목 삭제",
    description="특정 품목을 삭제합니다.",
)
def delete_product(request, product_id: int):
    """품목을 삭제합니다."""
    product = get_object_or_404(Product, id=product_id)
    product.delete()
    return {"success": True, "message": "품목이 삭제되었습니다."}

@router.get(
    "/products/search",
    summary="[R] 품목명 검색(자동완성)",
    description="품목명을 검색하여 자동완성용 목록을 반환합니다.",
)
def search_products(request, query: str = Query(...)):
    """품목명으로 검색합니다."""
    qs = Product.objects.filter(name__icontains=query).order_by("name")[:10]
    products = []
    for p in qs:
        products.append({
            "id": p.id,
            "name": p.name,
            "code": p.code,
        })
    return {"success": True, "data": products}

@router.get(
    "/products/{product_id}/history",
    summary="[R] 품목 입출고 내역 조회",
    description="품목 코드를 기반으로 품목 입출고 내역을 반환합니다.",
)
def get_product_history(request, product_id: int):
    """품목의 입출고 내역을 조회합니다."""
    product = get_object_or_404(Product, id=product_id)
    histories = ProductHistory.objects.filter(product=product).order_by('-created_at')
    
    history_list = []
    for history in histories:
        history_list.append({
            "처리일자": history.created_at.strftime("%Y-%m-%d %H:%M"),
            "상태": history.type,
            "수량": history.quantity,
            "현재재고": history.total_stock,
        })
    
    return {"success": True, "data": history_list}

@router.get(
    "/products/simple",
    summary="[R] 품목 간단 목록 조회",
    description="품목명, 품목 코드, 규격, 단위, 현재 재고만 반환하는 간단한 품목 목록을 제공합니다.",
    response=List[ProductSimpleSchema],
)
def list_simple_products(request):
    qs = Product.objects.all().order_by("name")
    return [
        ProductSimpleSchema(
            id=p.id,
            name=p.name,
            code=p.code,
            spec=p.spec,
            unit=p.unit,
            current_stock=getattr(p, "current_stock", 0),
        ) for p in qs
    ]

@router.post(
    "/products/upload-excel",
    summary="[C] 엑셀로 품목 일괄 등록",
    description="엑셀 파일을 업로드하여 품목을 한 번에 등록합니다.",
    response=ProductExcelUploadResponseSchema,
)
def upload_product_excel(request, file: UploadedFile = File(...)):
    """엑셀 파일로 품목을 일괄 등록합니다."""
    try:
        filename = file.name.lower()
        if not filename.endswith((".xlsx", ".xls")):
            return {"success": False, "message": "엑셀 파일만 지원합니다.", "data": None}

        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as temp_file:
            temp_file.write(file.read())
            temp_path = temp_file.name

        try:
            df = pd.read_excel(temp_path)
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

        products = []
        for _, row in df.iterrows():
            try:
                factory_id = int(row.get("공장ID", 1))
                factory = Factory.objects.get(id=factory_id)
                product = Product.objects.create(
                    factory=factory,
                    name=row.get("품목명", ""),
                    code=row.get("품목코드", ""),
                    spec=row.get("규격", ""),
                    unit=row.get("단위", ""),
                    current_stock=int(row.get("현재재고", 0)),
                    location=row.get("창고위치", None),
                    note=row.get("특이사항", None),
                )
                products.append({
                    "id": product.id,
                    "name": product.name,
                    "code": product.code,
                    "spec": product.spec,
                    "unit": product.unit,
                    "current_stock": product.current_stock,
                })
            except Exception as e:
                continue

        if not products:
            return {"success": False, "message": "등록된 품목이 없습니다. 파일을 확인하세요.", "data": None}

        return {"success": True, "message": "엑셀 업로드 및 품목 등록 완료", "data": products}

    except Exception as e:
        return {"success": False, "message": f"파일 처리 중 오류: {str(e)}", "data": None}

@router.get(
    "/products/{product_id}/materials",
    summary="[R] 품목-원자재 연결 목록 조회",
    description="특정 품목에 연결된 원자재 목록을 반환합니다.",
    response=ProductMaterialRelationListSchema,
)
def get_product_material_relations(request, product_id: int):
    """
    특정 품목에 연결된 원자재 목록을 반환합니다.
    """
    relations = MaterialProduct.objects.filter(product_id=product_id)
    result = [
        ProductMaterialRelationSchema(
            id=rel.id,
            material_id=rel.material.id,
            material_name=rel.material.name,
            quantity=float(rel.quantity),
        ) for rel in relations
    ]
    return ProductMaterialRelationListSchema(relations=result, total_count=len(result))

@router.post(
    "/products/{product_id}/add-material",
    summary="[C] 품목-원자재 연결 추가",
    description="특정 품목에 원자재를 연결합니다.",
    response=ProductMaterialRelationSchema,
)
def add_product_material_relation(request, product_id: int, payload: ProductMaterialConnectSchema):
    """
    특정 품목에 원자재를 연결합니다.
    """
    product = get_object_or_404(Product, id=product_id)
    material = get_object_or_404(Material, id=payload.material_id)
    relation = MaterialProduct.objects.create(
        product=product,
        material=material,
        quantity=payload.quantity,
    )
    return ProductMaterialRelationSchema(
        id=relation.id,
        material_id=material.id,
        material_name=material.name,
        quantity=float(relation.quantity),
    )

@router.delete(
    "/products/{product_id}/materials/{relation_id}",
    summary="[D] 품목-원자재 연결 삭제",
    description="특정 품목에서 원자재 연결을 삭제합니다.",
)
def delete_product_material_relation(request, product_id: int, relation_id: int):
    """
    특정 품목에서 원자재 연결을 삭제합니다.
    """
    relation = get_object_or_404(MaterialProduct, id=relation_id, product_id=product_id)
    relation.delete()
    return {"success": True, "message": "연결이 삭제되었습니다."}

@router.get(
    "/production-time-calculator",
    summary="[R] 평균 생산 시간 계산",
    description="단위당 생산하는 시간을 계산하여 반환합니다.",
)
def calculate_production_time(request, product_id: int = Query(...)):
    """품목의 평균 생산 시간을 계산합니다."""
    product = get_object_or_404(Product, id=product_id)
    
    # 여기서는 간단히 모델의 저장된 값을 반환하지만,
    # 실제로는 생산 이력 데이터를 기반으로 계산할 수 있습니다.
    production_time = product.average_production_time or 0
    
    return {
        "success": True,
        "data": {
            "품목명": product.name,
            "평균생산시간(초)": production_time,
            "평균생산시간(분)": production_time / 60 if production_time else 0,
        }
    }
