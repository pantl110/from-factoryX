from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from tax.schemas.outbound import NotLinkedTaxInvoiceOut
from tax.schemas.inbound import LinkTaxInvoiceIn
from api.security import jwt_auth
from typing import List


router = Router(tags=["Tax"], auth=jwt_auth)


@router.get(
    "/unlinked",
    summary="[C] 연동되지 않은 세금계산서 조회",
    description="연동되지 않은 세금계산서를 모두 조회합니다.",
    response={200: List[NotLinkedTaxInvoiceOut], 500: dict}
)
@paginate
async def list_not_link_tax(request):
    """
    연동되지 않은 세금계산서를 모두 조회합니다.
    
    입력 필드: 없음
    
    반환 필드:
    - id: 세금계산서 ID (NationalTaxService.id)
    - tax_invoice_type: 세금계산서 유형 (NationalTaxService.tax_invoice_type)
    - transaction_date: 거래일자 (NationalTaxService.transaction_date)
    - client_name: 거래처명 (NationalTaxService.client.name)
    - product_names: 품목명 배열 (NationalTaxService.product.name 배열)
    - transaction_amount: 공급가액 (NationalTaxService.transaction_amount)
    - tax_amount: 세액 (NationalTaxService.tax_amount)
    - total_amount: 합계금액 (transaction_amount + tax_amount)
    """
    try:
        @sync_to_async
        def get_unlinked_tax_invoices():
            from tax.models import NationalTaxService
            
            # 프로젝트에 연결되지 않은 세금계산서만 조회
            unlinked_invoices = NationalTaxService.objects.filter(
                projects__isnull=True  # 연결된 프로젝트가 없는 것
            ).prefetch_related(
                'client',  # 거래처 정보
                'product'   # 품목 정보 (ManyToMany)
            ).order_by('-transaction_date')  # 최신 날짜순 정렬
            
            return list(unlinked_invoices)
        
        invoices = await get_unlinked_tax_invoices()
        result = []
        
        for invoice in invoices:
            # 품목명 목록 생성 (ManyToMany 관계)
            product_names = []
            for product in invoice.product.all():
                product_names.append(product.name)
            
            # 합계금액 계산
            total_amount = invoice.transaction_amount + invoice.tax_amount
            
            # 세금계산서 유형 한글화
            tax_invoice_type_map = {
                'sales': '매출',
                'purchase': '매입'
            }
            tax_invoice_type_kr = tax_invoice_type_map.get(
                invoice.tax_invoice_type, 
                invoice.tax_invoice_type
            )
            
            result.append(NotLinkedTaxInvoiceOut(
                id=invoice.id,
                tax_invoice_type=tax_invoice_type_kr,
                transaction_date=invoice.transaction_date,
                client_name=invoice.client.name,
                product_names=product_names,
                transaction_amount=invoice.transaction_amount,
                tax_amount=invoice.tax_amount,
                total_amount=total_amount
            ))
        
        return result
        
    except Exception as e:
        raise HttpError(500, "연동되지 않은 세금계산서 조회 중 내부 서버 오류가 발생했습니다.")


@router.post(
    "/link",
    summary="[C] 선택된 세금계산서 연결",
    description="선택된 세금계산서를 프로젝트에 연결합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict}
)
async def link_tax(request, payload: LinkTaxInvoiceIn):
    """
    선택된 세금계산서를 프로젝트에 연결합니다.
    
    입력 필드:
    - project_id: 프로젝트 ID (int)
    - tax_id: 세금계산서 ID (int)
    
    반환 필드: 없음 (성공 시 빈 응답)
    """
    try:
        @sync_to_async
        def link_tax_invoice():
            from project.models import Project
            from tax.models import NationalTaxService
            
            # 프로젝트 존재 확인
            try:
                project = Project.objects.get(id=payload.project_id)
            except Project.DoesNotExist:
                raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
            
            # 세금계산서 존재 확인
            try:
                tax_invoice = NationalTaxService.objects.get(id=payload.tax_id)
            except NationalTaxService.DoesNotExist:
                raise HttpError(404, f"세금계산서 ID {payload.tax_id}를 찾을 수 없습니다.")
            
            # 이미 다른 프로젝트에 연결되어 있는지 확인
            if tax_invoice.projects.exists():
                raise HttpError(400, f"세금계산서 ID {payload.tax_id}는 이미 다른 프로젝트에 연결되어 있습니다.")
            
            # 프로젝트의 기존 세금계산서가 있다면 제거
            if project.tax_invoice:
                project.tax_invoice = None
                project.save()
            
            # 새로운 세금계산서 연결
            project.tax_invoice = tax_invoice
            project.save()
            
            return {}
        
        result = await link_tax_invoice()
        return result
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "세금계산서 연결 중 내부 서버 오류가 발생했습니다.")