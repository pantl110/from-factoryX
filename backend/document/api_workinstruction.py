from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from asgiref.sync import sync_to_async
from document.schemas.outbound import (
    WorkInstructionModelOut,
    WorkInstructionDetailModelOut,
)
from document.models import WorkInstruction, WorkInstructionHistory
from django.db import models
from django.db.models import Prefetch, F
from project.models import ProjectPlan
from factory.utils import is_factory_member
from document.schemas.inbound import WorkInstructionUpdateIn
from document.schemas.outbound import WorkInstructionHistoryOut
from document.utils import create_work_instruction_memo_history


router = Router(
    tags=["Work Instruction"],
    auth=jwt_auth,
)


@router.get(
    "",
    summary="[C] 작업 지시서 목록 조회",
    description="작업 지시서 목록을 조회합니다.",
    response=list[WorkInstructionModelOut],
)
@paginate
async def get_work_instructions(
    request,
    order_by: str = Query("-created_at"),
    q: str | None = Query(None, description="검색어(거래처명/품목명)"),
):
    user = request.auth
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    await is_factory_member(int(factory_id), user)

    @sync_to_async
    def work_instructions_list():
        queryset = WorkInstruction.objects.prefetch_related(
            Prefetch(
                "plans",
                queryset=ProjectPlan.objects.select_related("product__product")
                .prefetch_related("project__quotations__client")
                .annotate(
                    product_name=F("product__product__name"),
                ),
            )
        ).filter(factory_id=factory_id)

        # 검색어: 계획의 거래처명/품목명 기준
        if q:
            queryset = queryset.filter(
                models.Q(plans__project__quotations__client__name__icontains=q)
                | models.Q(plans__product__product__name__icontains=q)
            ).distinct()

        if order_by:
            queryset = queryset.order_by(order_by)
        
        work_instructions = list(queryset)
        
        # client_name은 client_info에서 가져오기
        for work_instruction in work_instructions:
            for plan in work_instruction.plans.all():
                if plan.project:
                    quotation = plan.project.quotations.first()
                    if quotation and quotation.client_info and isinstance(quotation.client_info, dict):
                        plan.client_name = quotation.client_info.get("name")
                    elif quotation and quotation.client:
                        plan.client_name = quotation.client.name
        
        return work_instructions

    work_instructions = await work_instructions_list()
    return work_instructions


@router.get(
    "/{work_instruction_id}",
    summary="[C] 작업 지시서 상세 조회",
    description="작업 지시서 상세를 조회합니다.",
    response=WorkInstructionDetailModelOut,
)
async def get_work_instruction(request, work_instruction_id: int):
    user = request.auth
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    await is_factory_member(int(factory_id), user)

    @sync_to_async
    def get_work_instruction_detail():
        try:
            work_instruction = WorkInstruction.objects.prefetch_related(
                Prefetch(
                    "plans",
                    queryset=ProjectPlan.objects.select_related("product__product")
                    .prefetch_related("project__quotations__client")
                    .annotate(
                        equipment_name=F("equipment__name"),
                        product_name=F("product__product__name"),
                        product_code=F("product__product__code"),
                        product_unit=F("product__product__unit"),
                        product_spec=F("product__product__spec"),
                        product_note=F("product__product__note"),
                    ),
                )
            ).get(id=work_instruction_id, factory_id=factory_id)
            
            # client_name은 client_info에서 가져오기
            for plan in work_instruction.plans.all():
                if plan.project:
                    quotation = plan.project.quotations.first()
                    if quotation and quotation.client_info and isinstance(quotation.client_info, dict):
                        plan.client_name = quotation.client_info.get("name")
                    elif quotation and quotation.client:
                        plan.client_name = quotation.client.name
            
            return work_instruction
        except WorkInstruction.DoesNotExist:
            raise HttpError(404, "작업 지시서를 찾을 수 없습니다.")

    work_instruction = await get_work_instruction_detail()
    return work_instruction


@router.patch(
    "/{work_instruction_id}",
    summary="[C] 작업 지시서 수정",
    description="작업 지시서를 수정합니다.",
    response=WorkInstructionDetailModelOut,
)
async def update_work_instruction(
    request, work_instruction_id: int, payload: WorkInstructionUpdateIn
):
    user = request.auth
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    await is_factory_member(int(factory_id), user)

    @sync_to_async
    def mark_work_instruction_complete():
        try:
            work_instruction = WorkInstruction.objects.prefetch_related(
                Prefetch(
                    "plans",
                    queryset=ProjectPlan.objects.select_related("product__product")
                    .prefetch_related("project__quotations__client")
                    .annotate(
                        product_name=F("product__product__name"),
                        product_code=F("product__product__code"),
                        product_unit=F("product__product__unit"),
                        product_spec=F("product__product__spec"),
                    ),
                )
            ).get(id=work_instruction_id, factory_id=factory_id)
            
            # 메모 수정 전 값 저장
            old_memo = work_instruction.memo
            
            # 값 업데이트
            for attr, value in payload.dict(exclude_unset=True).items():
                setattr(work_instruction, attr, value)
            work_instruction.save()
            
            # 메모가 수정된 경우 history 기록
            if "memo" in payload.dict(exclude_unset=True) and old_memo != work_instruction.memo:
                create_work_instruction_memo_history(
                    work_instruction=work_instruction,
                    old_memo=old_memo,
                    new_memo=work_instruction.memo,
                    changed_by=user,
                )
            
            # client_name은 client_info에서 가져오기
            for plan in work_instruction.plans.all():
                if plan.project:
                    quotation = plan.project.quotations.first()
                    if quotation and quotation.client_info and isinstance(quotation.client_info, dict):
                        plan.client_name = quotation.client_info.get("name")
                    elif quotation and quotation.client:
                        plan.client_name = quotation.client.name
            
            return work_instruction
        except WorkInstruction.DoesNotExist:
            raise HttpError(404, "작업 지시서를 찾을 수 없습니다.")

    work_instruction = await mark_work_instruction_complete()
    return work_instruction


@router.get(
    "/{work_instruction_id}/history",
    summary="[C] 작업 지시서 변경 이력 조회",
    description="작업 지시서의 변경 이력을 조회합니다.",
    response=list[WorkInstructionHistoryOut],
)
async def get_work_instruction_history(
    request, work_instruction_id: int
):
    user = request.auth
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    await is_factory_member(int(factory_id), user)

    @sync_to_async
    def get_history():
        try:
            # WorkInstruction 존재 확인
            work_instruction = WorkInstruction.objects.get(
                id=work_instruction_id, factory_id=factory_id
            )
        except WorkInstruction.DoesNotExist:
            raise HttpError(404, "작업 지시서를 찾을 수 없습니다.")

        # History 조회 (plan 관련 정보도 함께 가져오기)
        from django.db.models import F
        
        histories = WorkInstructionHistory.objects.filter(
            work_instruction_id=work_instruction_id
        ).select_related(
            "changed_by",
            "plan",
            "plan__product",
            "plan__product__product",
            "plan__project",
            "plan__equipment",
        ).prefetch_related(
            "plan__project__quotations",
        ).annotate(
            equipment_name=F("plan__equipment__name"),
            product_name=F("plan__product__product__name"),
            product_code=F("plan__product__product__code"),
            product_unit=F("plan__product__product__unit"),
            product_spec=F("plan__product__product__spec"),
            product_note=F("plan__product__product__note"),
        ).order_by("-created_at")

        result = []
        for history in histories:
            # plan 객체를 ProjectPlanDetailModelOut 형태로 변환
            plan_data = None
            if history.plan:
                from document.schemas.outbound import ProjectPlanDetailModelOut
                try:
                    # plan의 관계 필드들이 제대로 로드되었는지 확인
                    # 필요한 필드들을 접근하여 로드 확인
                    project_id = history.plan.project_id
                    product_id = history.plan.product_id
                    equipment_id = history.plan.equipment_id
                    
                    # client_name은 client_info에서 가져오기
                    client_name = None
                    if history.plan.project:
                        quotation = history.plan.project.quotations.first()
                        if quotation and quotation.client_info and isinstance(quotation.client_info, dict):
                            client_name = quotation.client_info.get("name")
                        elif quotation and quotation.client:
                            client_name = quotation.client.name
                    
                    # from_orm을 사용하면 _id 필드가 누락될 수 있으므로 수동으로 dict 구성
                    plan_dict = ProjectPlanDetailModelOut.from_orm(history.plan).dict()
                    # 필수 ForeignKey 필드들을 명시적으로 추가
                    plan_dict['project_id'] = project_id
                    plan_dict['product_id'] = product_id
                    plan_dict['equipment_id'] = equipment_id
                    
                    # annotate로 가져온 필드들을 추가 (None이어도 포함)
                    if hasattr(history, 'equipment_name'):
                        plan_dict['equipment_name'] = history.equipment_name
                    if hasattr(history, 'product_name'):
                        plan_dict['product_name'] = history.product_name
                    
                    # 변경 전/후 설비 이름 가져오기 (before_data/after_data에서 직접 가져옴)
                    equipment_name_before = None
                    if history.before_data and 'equipment_name' in history.before_data:
                        equipment_name_before = history.before_data['equipment_name']
                    
                    equipment_name_after = None
                    if history.after_data and 'equipment_name' in history.after_data:
                        equipment_name_after = history.after_data['equipment_name']
                    elif hasattr(history, 'equipment_name') and history.equipment_name:
                        # after_data에 없으면 annotate로 가져온 값 사용
                        equipment_name_after = history.equipment_name
                    
                    # 설비 이름 필드 추가
                    if equipment_name_before:
                        plan_dict['equipment_name_before'] = equipment_name_before
                    if equipment_name_after:
                        plan_dict['equipment_name_after'] = equipment_name_after
                    # 현재 설비 이름도 유지 (기본값, 변경 후 설비 이름)
                    if not plan_dict.get('equipment_name') and equipment_name_after:
                        plan_dict['equipment_name'] = equipment_name_after
                    
                    if client_name:
                        plan_dict['client_name'] = client_name
                    
                    plan_data = plan_dict
                except Exception as e:
                    # plan이 삭제되었거나 관계 필드에 접근할 수 없는 경우
                    # before_data나 after_data에서 정보를 가져올 수 있음
                    plan_data = None
            
            # changed_by를 UserMeOut 형태로 변환
            changed_by_data = None
            if history.changed_by:
                from user.schemas.outbound import UserMeOut
                changed_by_data = UserMeOut.from_orm(history.changed_by).dict()
            
            result.append({
                "id": history.id,
                "action": history.action,
                "work_instruction_id": history.work_instruction_id,
                "plan": plan_data,
                "changed_by": changed_by_data,
                "before_data": history.before_data,
                "after_data": history.after_data,
                "created_at": history.created_at,
                "updated_at": history.updated_at,
            })
        
        return result

    history_list = await get_history()
    return history_list
