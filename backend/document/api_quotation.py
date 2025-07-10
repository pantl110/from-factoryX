from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from document.schemas.inbound import QuotationCreateIn
from document.schemas.outbound import QuotationCreateOut
from document.models import Quotation

router = Router(tags=["Quotation"], auth=jwt_auth)

# 테스트 필요
@router.post(
    "/quotation/create",
    summary="[C] 견적서 생성",
    description="견적서 생성 단계에서 필요한 빈 견적서를 생성합니다.",
    response={201: QuotationCreateOut}
)
async def create_quotation(request, payload: QuotationCreateIn):
    # 프로젝트 ID만 받아서 견적서 생성, 다른 필드들은 null로 설정
    new_quotation = await Quotation.objects.acreate(
        project_id=payload.project_id,
        factory=None,
        client=None,
        due_date=None,
        uploaded_file=None
    )
    return 201, new_quotation


