from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from tax.models import TaxInvoiceAccount
from tax.schemas.outbound import TaxInvoiceAccountOut

router = Router(tags=["Tax V2"], auth=jwt_auth)


@router.get(
    "/account/{tax_id}",
    summary="[C] 세금계산서 채권/채무 정보 조회",
    description="세금계산서 ID로 채권/채무 정보를 조회합니다.",
    response={200: TaxInvoiceAccountOut, 404: dict, 500: dict},
)
async def get_tax_invoice_account(request, tax_id: int):
    @sync_to_async
    def get_account():
        try:
            account = TaxInvoiceAccount.objects.select_related(
                "tax_invoice", "project"
            ).get(tax_invoice_id=tax_id)
            return account
        except TaxInvoiceAccount.DoesNotExist:
            raise HttpError(404, "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.")
    
    account = await get_account()
    return account
