from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from asgiref.sync import sync_to_async
from document.schemas.outbound import (
    WorkInstructionModelOut,
    WorkInstructionDetailModelOut,
)
from document.models import WorkInstruction
from django.db.models import Prefetch, F
from project.models import ProjectPlan
from factory.utils import is_factory_member
from document.schemas.inbound import WorkInstructionUpdateIn


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
async def get_work_instructions(request, order_by: str = Query("-created_at")):
    user = request.auth
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    await is_factory_member(factory_id, user)

    @sync_to_async
    def work_instructions_list():
        queryset = WorkInstruction.objects.prefetch_related(
            Prefetch(
                "plans",
                queryset=ProjectPlan.objects.select_related("product__product")
                .prefetch_related("project__quotations__client")
                .annotate(
                    client_name=F("project__quotations__client__name"),
                    product_name=F("product__product__name"),
                ),
            )
        ).filter(factory_id=factory_id)

        if order_by:
            queryset = queryset.order_by(order_by)
        return list(queryset)

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
    await is_factory_member(factory_id, user)

    @sync_to_async
    def get_work_instruction_detail():
        try:
            return WorkInstruction.objects.prefetch_related(
                Prefetch(
                    "plans",
                    queryset=ProjectPlan.objects.select_related("product__product")
                    .prefetch_related("project__quotations__client")
                    .annotate(
                        client_name=F("project__quotations__client__name"),
                        product_name=F("product__product__name"),
                        product_code=F("product__product__code"),
                        product_unit=F("product__product__unit"),
                        product_spec=F("product__product__spec"),
                    ),
                )
            ).get(id=work_instruction_id, factory_id=factory_id)
        except WorkInstruction.DoesNotExist:
            raise HttpError(404, "작업 지시서를 찾을 수 없습니다.")

    work_instruction = await get_work_instruction_detail()
    return work_instruction


@router.patch(
    "/{work_instruction_id}",
    summary="[C] 작업 지시서 완료 처리",
    description="작업 지시서를 완료 처리합니다.",
    response=WorkInstructionDetailModelOut,
)
async def update_work_instruction(
    request, work_instruction_id: int, payload: WorkInstructionUpdateIn
):
    user = request.auth
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    await is_factory_member(factory_id, user)

    @sync_to_async
    def mark_work_instruction_complete():
        try:
            work_instruction = WorkInstruction.objects.prefetch_related(
                Prefetch(
                    "plans",
                    queryset=ProjectPlan.objects.select_related("product__product")
                    .prefetch_related("project__quotations__client")
                    .annotate(
                        client_name=F("project__quotations__client__name"),
                        product_name=F("product__product__name"),
                        product_code=F("product__product__code"),
                        product_unit=F("product__product__unit"),
                        product_spec=F("product__product__spec"),
                    ),
                )
            ).get(id=work_instruction_id, factory_id=factory_id)
            for attr, value in payload.dict(exclude_unset=True).items():
                setattr(work_instruction, attr, value)
            work_instruction.save()
            return work_instruction
        except WorkInstruction.DoesNotExist:
            raise HttpError(404, "작업 지시서를 찾을 수 없습니다.")

    work_instruction = await mark_work_instruction_complete()
    return work_instruction
