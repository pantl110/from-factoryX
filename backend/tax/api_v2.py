from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from tax.models import TaxInvoiceAccount
from tax.schemas.outbound import TaxInvoiceAccountOut
from tax.schemas.inbound import TaxInvoiceAccountUpdateIn

router = Router(tags=["Tax V2"], auth=jwt_auth)


@router.patch(
    "/account/{tax_id}",
    summary="[U] 세금계산서 채권/채무 정보 수정",
    description="세금계산서 ID로 채권/채무 정보를 수정합니다.",
    response={200: TaxInvoiceAccountOut, 404: dict, 400: dict, 500: dict},
)
async def update_tax_invoice_account(request, tax_id: int, payload: TaxInvoiceAccountUpdateIn):
    @sync_to_async
    def update_account():
        try:
            account = TaxInvoiceAccount.objects.select_related(
                "tax_invoice", "tax_invoice__client", "project"
            ).get(tax_invoice_id=tax_id)
        except TaxInvoiceAccount.DoesNotExist:
            raise HttpError(404, "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.")
        
        # 필드 업데이트
        update_data = payload.dict(exclude_unset=True)
        
        # project_id를 project로 변환
        if "project_id" in update_data:
            project_id = update_data.pop("project_id")
            if project_id is not None:
                from project.models import Project
                try:
                    account.project = Project.objects.get(id=project_id)
                except Project.DoesNotExist:
                    raise HttpError(400, f"프로젝트 ID {project_id}를 찾을 수 없습니다.")
            else:
                account.project = None
        
        # 나머지 필드 업데이트
        for field, value in update_data.items():
            if hasattr(account, field):
                setattr(account, field, value)
        
        account.save()
        return account
    
    account = await update_account()
    return account


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
            from project.models import Project

            account = TaxInvoiceAccount.objects.select_related(
                "tax_invoice", "tax_invoice__client", "project"
            ).get(tax_invoice_id=tax_id)

            # 하나의 세금계산서에는 하나의 프로젝트만 연결된다는 전제 하에
            # tax_invoice 인스턴스에 project_id 속성을 미리 세팅해 둔다.
            project = Project.objects.filter(tax_invoice=account.tax_invoice).first()
            if project:
                setattr(account.tax_invoice, "project_id", project.id)
            else:
                setattr(account.tax_invoice, "project_id", None)

            return account
        except TaxInvoiceAccount.DoesNotExist:
            raise HttpError(404, "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.")
    
    account = await get_account()
    return account
