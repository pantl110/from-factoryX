from ninja.errors import HttpError
from project.models import ProjectPlan, ProjectPlanMaterialUsage
from stock.schemas.outbound import MaterialUsageOut


def check_plan_permission(plan_id: int, factory_id: int) -> ProjectPlan:
    """Plan 존재 확인 및 공장 권한 검증"""
    try:
        plan = ProjectPlan.objects.select_related("project").get(id=plan_id)
        if not plan.project.quotations.filter(factory_id=factory_id).exists():
            raise HttpError(403, "해당 프로젝트 플랜에 접근할 권한이 없습니다.")
        return plan
    except ProjectPlan.DoesNotExist:
        raise HttpError(404, "해당 프로젝트 플랜을 찾을 수 없습니다.")


def build_material_usage_out(usage: ProjectPlanMaterialUsage) -> MaterialUsageOut:
    """ProjectPlanMaterialUsage 인스턴스를 MaterialUsageOut으로 변환"""
    lot_number = None
    material_history_id = None
    material_repackaging_id = None

    if usage.material_history:
        lot_number = usage.material_history.lot_number
        material_history_id = usage.material_history.id
    elif usage.material_repackaging:
        lot_number = usage.material_repackaging.lot_number
        material_repackaging_id = usage.material_repackaging.id

    return MaterialUsageOut(
        id=usage.id,
        plan_id=usage.plan_id,
        material_id=usage.material.id,
        material_name=usage.material.name,
        material_unit=usage.material.unit,
        original_material_id=usage.original_material.id if usage.original_material else None,
        original_material_name=usage.original_material.name if usage.original_material else None,
        usage_amount=usage.usage_amount,
        material_history_id=material_history_id,
        material_history_lot_number=lot_number if material_history_id else None,
        material_repackaging_id=material_repackaging_id,
        material_repackaging_lot_number=lot_number if material_repackaging_id else None,
        created_at=usage.created_at,
        updated_at=usage.updated_at,
    )



