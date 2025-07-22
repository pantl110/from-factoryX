from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from tax.schemas.outbound import NotLinkedTaxInvoiceOut, AllTaxInvoiceOut
from tax.schemas.inbound import LinkTaxInvoiceIn
from api.security import jwt_auth
from typing import List
from ninja import Query
from tax.models import NationalTaxService
from django.db import models


router = Router(tags=["Tax"], auth=jwt_auth)


# Tax Tab
@router.get(
    "/published",
    summary="[C] 발행된 모든 세금계산서 조회",
    description="조건에 따라 세금계산서를 조회합니다.",
    response={200: List[AllTaxInvoiceOut], 400: dict, 500: dict}
)
@paginate
async def list_published_tax_invoices(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    q: str = Query(None, description="거래처명 또는 품목명 통합 검색어"),
    tax_invoice_type: str = Query("all", description="세금계산서 유형: all(전체), sales(매출), purchase(매입)"),
):
    """
    조건에 따라 세금계산서를 조회합니다.

    입력 필드:
    - factory_id: 공장 ID (필수)
    - q: 거래처명 또는 품목명 통합 검색어 (선택)
    - tax_invoice_type: all(전체, 기본값), sales(매출), purchase(매입)

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
        def get_all_tax_invoices():
            from tax.models import NationalTaxService
            qs = NationalTaxService.objects.filter(
                client__factory_id=factory_id,
                publish_status="published"
            ).prefetch_related('client', 'product').order_by('-transaction_date')

            if tax_invoice_type == "sales":
                qs = qs.filter(tax_invoice_type="sales")
            elif tax_invoice_type == "purchase":
                qs = qs.filter(tax_invoice_type="purchase")
            # "all"이면 필터 없음

            if q:
                ids_client = list(qs.filter(client__name__icontains=q).values_list('id', flat=True))
                ids_product = list(qs.filter(product__name__icontains=q).values_list('id', flat=True))
                ids = set(ids_client) | set(ids_product)
                qs = qs.filter(id__in=ids)

            return list(qs.distinct())

        invoices = await get_all_tax_invoices()
        result = []
        for invoice in invoices:
            product_names = [product.name for product in invoice.product.all()]
            total_amount = invoice.transaction_amount + invoice.tax_amount
            tax_invoice_type_map = {
                'sales': '매출',
                'purchase': '매입'
            }
            tax_invoice_type_kr = tax_invoice_type_map.get(
                invoice.tax_invoice_type, 
                invoice.tax_invoice_type
            )
            result.append(AllTaxInvoiceOut(
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
        raise HttpError(500, f"세금계산서 조회 중 내부 서버 오류가 발생했습니다: {e}")


# Tax Tab
@router.get(
    "/pending",
    summary="[C] 발행대기/임시저장 세금계산서 조회",
    description="발행대기 또는 임시저장 상태의 세금계산서를 조회합니다.",
    response={200: List[AllTaxInvoiceOut], 400: dict, 500: dict}
)
@paginate
async def list_pending_tax_invoices(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    q: str = Query(None, description="거래처명 또는 품목명 통합 검색어"),
    publish_status: str = Query("all", description="세금계산서 상태: all(전체), pending(발행대기), temporary(임시저장)"),
):
    """
    발행대기/임시저장 상태의 세금계산서를 조회합니다.

    입력 필드:
    - factory_id: 공장 ID (필수)
    - q: 거래처명 또는 품목명 통합 검색어 (선택)
    - publish_status: all(전체, 기본값), pending(발행대기), temporary(임시저장)

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
        def get_pending_tax_invoices():
            from tax.models import NationalTaxService
            qs = NationalTaxService.objects.filter(
                client__factory_id=factory_id
            ).prefetch_related('client', 'product').order_by('-transaction_date')

            # 상태 필터
            if publish_status == "pending":
                qs = qs.filter(publish_status="pending")
            elif publish_status == "temporary":
                qs = qs.filter(publish_status="temporary")
            else:  # all
                qs = qs.filter(publish_status__in=["pending", "temporary"])

            # 통합 검색
            if q:
                ids_client = list(qs.filter(client__name__icontains=q).values_list('id', flat=True))
                ids_product = list(qs.filter(product__name__icontains=q).values_list('id', flat=True))
                ids = set(ids_client) | set(ids_product)
                qs = qs.filter(id__in=ids)

            return list(qs.distinct())

        invoices = await get_pending_tax_invoices()
        result = []
        for invoice in invoices:
            product_names = [product.name for product in invoice.product.all()]
            total_amount = invoice.transaction_amount + invoice.tax_amount
            tax_invoice_type_map = {
                'sales': '매출',
                'purchase': '매입'
            }
            tax_invoice_type_kr = tax_invoice_type_map.get(
                invoice.tax_invoice_type, 
                invoice.tax_invoice_type
            )
            result.append(AllTaxInvoiceOut(
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
        raise HttpError(500, f"세금계산서 조회 중 내부 서버 오류가 발생했습니다: {e}")


# Tax Tab
@router.get(
    "/unlinked",
    summary="[C] 연동되지 않은 세금계산서 조회",
    description="연동되지 않은 세금계산서를 모두 조회합니다.",
    response={200: List[NotLinkedTaxInvoiceOut], 400: dict, 500: dict}
)
@paginate
async def list_not_link_tax(request):
    """
    연동되지 않은 세금계산서를 모두 조회합니다.
    
    입력 필드:
    - factory_id: 공장 ID (필수)
    - q: 거래처명 검색어 (선택)
    
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
        q = request.GET.get("q")
        factory_id = request.GET.get("factory_id")
        if not factory_id:
            raise HttpError(400, "factory_id는 필수 입력값입니다.")
        @sync_to_async
        def get_unlinked_tax_invoices():
            qs = NationalTaxService.objects.filter(
                projects__isnull=True,
                client__factory_id=factory_id
            ).prefetch_related(
                'client',
                'product'
            ).order_by('-transaction_date')
            if q:
                qs = qs.filter(client__name__icontains=q)
            return list(qs)
        invoices = await get_unlinked_tax_invoices()
        result = []
        for invoice in invoices:
            product_names = [product.name for product in invoice.product.all()]
            total_amount = invoice.transaction_amount + invoice.tax_amount
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


# Project Tab
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