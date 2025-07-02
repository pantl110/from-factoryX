from ninja import Router, Query, File
from django.shortcuts import get_object_or_404
from stock.models import Material, Factory
from stock.schemas.inbound import MaterialCreateSchema, MaterialUpdateSchema, MaterialExcelUploadResponseSchema
from stock.schemas.outbound import MaterialResponseSchema, MaterialListResponseSchema, MaterialSimpleSchema
from typing import List
from api.security import jwt_auth
from ninja.files import UploadedFile
import pandas as pd
import tempfile, os

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
