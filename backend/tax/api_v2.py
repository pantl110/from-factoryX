from ninja import Router, Query
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List
from datetime import date
from api.security import jwt_auth
from tax.models import NationalTaxService, CashReceipt
from factory.utils import get_factory_by_id, is_factory_member
from tax.schemas.inbound import PublishedDocumentFilter
from tax.schemas.outbound import PublishedDocumentOut

router = Router(tags=["Tax V2"], auth=jwt_auth)


@router.get(
    "/published",
    summary="[C] 발행된 세금계산서 및 현금영수증 조회",
    description="""
    조건에 따라 세금계산서와 현금영수증을 조회합니다.
    
    **document_type 옵션:**
    - `None` (미지정): 세금계산서 + 현금영수증 모두 조회
    - `tax`: 세금계산서만 조회 (매출/매입 모두)
    - `cash-receipt`: 현금영수증만 조회 (매입만)
    - `purchase`: 매입 세금계산서 + 매입 현금영수증 함께 조회
    - `purchase-tax`: 매입 세금계산서만 조회
    - `sales-tax`: 매출 세금계산서만 조회
    
    **정렬 옵션 (ordering):**
    - `-transaction_date`: 거래일자 최신순 (기본값)
    - `transaction_date`: 거래일자 오래된순
    - `-agreed_payment_date`: 약정입금일 최신순
    - `agreed_payment_date`: 약정입금일 오래된순
    """,
    response=List[PublishedDocumentOut],
)
@paginate
async def list_published_documents(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    filters: PublishedDocumentFilter = Query(..., description="검색 필터"),
    ordering: str = Query(
        default="-transaction_date",
        description="정렬: -transaction_date(거래일자 최신순), transaction_date(거래일자 오래된순), -agreed_payment_date(약정입금일 최신순), agreed_payment_date(약정입금일 오래된순)",
    ),
):
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)
    # TODO: 권한 체크

    @sync_to_async
    def get_all_documents():
        document_type = getattr(filters, 'document_type', None)
        
        results = []
        
        # 세금계산서 조회 조건
        should_fetch_tax = (
            document_type is None or 
            document_type == "tax" or 
            document_type == "purchase" or 
            document_type == "purchase-tax" or
            document_type == "sales-tax"
        )
        
        # 현금영수증 조회 조건 (현금영수증은 매입만 있음)
        should_fetch_cash = (
            document_type is None or 
            document_type == "cash-receipt" or 
            document_type == "purchase"
        )
        
        # 세금계산서 조회
        if should_fetch_tax:
            tax_queryset = NationalTaxService.objects.filter(
                factory_id=factory_id, publish_status="published"
            ).prefetch_related("client", "tax_invoice_account")
            
            # 세금계산서 전용 필터 생성 (cash_receipt_type 제외)
            from tax.schemas.inbound import TaxInvoiceFilter
            tax_filter_dict = {}
            # document_type이 purchase, purchase-tax, sales-tax인 경우 해당 유형으로 필터링
            if document_type == "purchase" or document_type == "purchase-tax":
                tax_filter_dict['tax_invoice_type'] = "purchase"
            elif document_type == "sales-tax":
                tax_filter_dict['tax_invoice_type'] = "sales"
            if hasattr(filters, 'q') and filters.q:
                tax_filter_dict['q'] = filters.q
            if hasattr(filters, 'start_date') and filters.start_date:
                tax_filter_dict['start_date'] = filters.start_date
            if hasattr(filters, 'end_date') and filters.end_date:
                tax_filter_dict['end_date'] = filters.end_date
            if hasattr(filters, 'is_hidden') and filters.is_hidden is not None:
                tax_filter_dict['is_hidden'] = filters.is_hidden
            if hasattr(filters, 'account_status') and filters.account_status:
                tax_filter_dict['account_status'] = filters.account_status
            
            # TaxInvoiceFilter로 필터링
            if tax_filter_dict:
                tax_filter = TaxInvoiceFilter(**tax_filter_dict)
                tax_queryset = tax_filter.filter(tax_queryset)
            
            # 정렬 처리
            if ordering:
                # agreed_payment_date 정렬의 경우 account를 통해 접근
                if ordering in ["agreed_payment_date", "-agreed_payment_date"]:
                    if ordering.startswith("-"):
                        tax_queryset = tax_queryset.order_by("-tax_invoice_account__agreed_payment_date")
                    else:
                        tax_queryset = tax_queryset.order_by("tax_invoice_account__agreed_payment_date")
                else:
                    tax_queryset = tax_queryset.order_by(ordering)
            
            tax_invoices = list(tax_queryset)
            
            # 세금계산서 결과 변환
            for invoice in tax_invoices:
                account = None
                try:
                    account = invoice.tax_invoice_account
                except Exception:
                    pass
                
                # 프로젝트 ID 가져오기
                project = invoice.projects.first()
                project_id = project.id if project else None
                
                results.append(
                    PublishedDocumentOut(
                        document_type="tax",
                        id=invoice.id,
                        transaction_date=invoice.transaction_date,
                        client_name=invoice.client.name if invoice.client else "",
                        transaction_amount=invoice.transaction_amount or 0,
                        tax_amount=invoice.tax_amount or 0,
                        total_amount=(invoice.transaction_amount or 0) + (invoice.tax_amount or 0),
                        is_hidden=invoice.is_hidden,
                        account=account,
                        tax_invoice_type=invoice.tax_invoice_type,
                        project_id=project_id,
                        cash_receipt_type=None,
                        item_name=None,
                    )
                )
        
        # 현금영수증 조회
        if should_fetch_cash:
            cash_queryset = CashReceipt.objects.filter(
                client__factory_id=factory_id
            ).select_related("client").prefetch_related("cash_receipt_account")
            
            # 현금영수증 전용 필터 생성 (tax_invoice_type 제외)
            from tax.schemas.inbound import CashReceiptFilter
            cash_filter_dict = {}
            # document_type이 purchase인 경우 매입으로 필터링 (현금영수증은 매입만 있음)
            if document_type == "purchase":
                cash_filter_dict['cash_receipt_type'] = "purchase"
            if hasattr(filters, 'q') and filters.q:
                cash_filter_dict['q'] = filters.q
            if hasattr(filters, 'start_date') and filters.start_date:
                cash_filter_dict['start_date'] = filters.start_date
            if hasattr(filters, 'end_date') and filters.end_date:
                cash_filter_dict['end_date'] = filters.end_date
            if hasattr(filters, 'is_hidden') and filters.is_hidden is not None:
                cash_filter_dict['is_hidden'] = filters.is_hidden
            if hasattr(filters, 'account_status') and filters.account_status:
                cash_filter_dict['account_status'] = filters.account_status
            
            # CashReceiptFilter로 필터링
            if cash_filter_dict:
                cash_filter = CashReceiptFilter(**cash_filter_dict)
                cash_queryset = cash_filter.filter(cash_queryset)
            
            # 정렬 처리
            if ordering:
                # agreed_payment_date 정렬의 경우 account를 통해 접근
                if ordering in ["agreed_payment_date", "-agreed_payment_date"]:
                    if ordering.startswith("-"):
                        cash_queryset = cash_queryset.order_by("-cash_receipt_account__agreed_payment_date")
                    else:
                        cash_queryset = cash_queryset.order_by("cash_receipt_account__agreed_payment_date")
                else:
                    cash_queryset = cash_queryset.order_by(ordering)
            
            cash_receipts = list(cash_queryset)
            
            # 현금영수증 결과 변환
            for receipt in cash_receipts:
                account = None
                try:
                    account = receipt.cash_receipt_account
                except Exception:
                    pass
                
                results.append(
                    PublishedDocumentOut(
                        document_type="cash-receipt",
                        id=receipt.id,
                        transaction_date=receipt.transaction_date,
                        client_name=receipt.client.name if receipt.client else "",
                        transaction_amount=receipt.transaction_amount or 0,
                        tax_amount=receipt.tax_amount or 0,
                        total_amount=(receipt.transaction_amount or 0) + (receipt.tax_amount or 0),
                        is_hidden=receipt.is_hidden,
                        account=account,
                        tax_invoice_type=None,
                        project_id=None,
                        cash_receipt_type=receipt.cash_receipt_type,
                        item_name=receipt.item_name,
                    )
                )
        
        # 통합 결과 정렬
        if ordering:
            reverse = ordering.startswith("-")
            field = ordering.lstrip("-")
            
            # agreed_payment_date 정렬의 경우 account를 통해 접근
            if field == "agreed_payment_date":
                def get_agreed_payment_date(item):
                    if item.account and item.account.agreed_payment_date:
                        return item.account.agreed_payment_date
                    # account가 없거나 agreed_payment_date가 None인 경우 맨 뒤로
                    return date.max if reverse else date.min
                
                results.sort(key=get_agreed_payment_date, reverse=reverse)
            else:
                # transaction_date 등 일반 필드 정렬
                results.sort(key=lambda x: getattr(x, field) if getattr(x, field) is not None else (date.max if reverse else date.min), reverse=reverse)
        
        return results

    documents = await get_all_documents()
    return documents
