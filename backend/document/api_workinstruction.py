from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from asgiref.sync import sync_to_async
from document.schemas.outbound import WorkInstructionModelOut
from document.models import WorkInstruction


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

    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    @sync_to_async
    def work_instructions_list():
        queryset = WorkInstruction.objects.prefetch_related("plans").filter(
            factory_id=factory_id
        )
        if order_by:
            queryset = queryset.order_by(order_by)
        return list(queryset)

    work_instructions = await work_instructions_list()
    return work_instructions
