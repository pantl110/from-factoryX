from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from typing import List
from ninja import Query
from tax.models import NationalTaxService
from factory.utils import get_factory_by_id, is_factory_member, get_factory_client_by_id
from stock.utils import get_product_list_by_ids
from django.db import transaction
from tax.utils import get_tax_service_by_id
from tax.barobill_utils import issue_barobill_tax_invoice
from tax.schemas.inbound import NationalTaxServiceCreateIn, NationalTaxServiceUpdateIn
from tax.schemas.outbound import NationalTaxServiceOut, AllTaxInvoiceOut
from tax.schemas.outbound import (
    NotLinkedTaxInvoiceOut,
    AllTaxInvoiceOut,
    AllCashReceiptOut,
    TaxInvoiceByMaterialOut,
    CashReceiptByMaterialOut,
    CashReceiptMaterialInfoOut,
)
from tax.schemas.inbound import LinkTaxInvoiceIn
from api.security import jwt_auth
from typing import List
from ninja import Query
from tax.models import NationalTaxService, CashReceipt
from datetime import date
from project.models import Project


router = Router(tags=["Tax"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 세금계산서 생성",
    description="국세청 API 세금계산서를 생성합니다.",
    response={201: NationalTaxServiceOut, 400: dict, 500: dict},
)
async def create_tax_invoice(request, payload: NationalTaxServiceCreateIn):
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory")
    # 공장 소유권 검증
    member = await is_factory_member(factory_id, user)
    # member.role에 따라 권한 추가 검증
    factory = await get_factory_by_id(factory_id)
    client_id = data.pop("client")
    # 거래처 ID로 거래처 조회
    client = await get_factory_client_by_id(client_id, factory_id)
    product_ids = data.pop("product", [])

    # NationalTaxService 모델 인스턴스 생성
    @sync_to_async
    @transaction.atomic
    def create_tax_service():
        tax_service = NationalTaxService.objects.create(
            user=user,
            factory=factory,
            client=client,
            **data,
        )
        products = get_product_list_by_ids(product_ids, factory_id)
        tax_service.product.set(products)
        return tax_service

    tax_service = await create_tax_service()

    tax_service = await NationalTaxService.objects.prefetch_related("product").aget(
        id=tax_service.id,
    )

    return 201, tax_service


@router.get(
    "/{tax_id}",
    summary="[C] 세금계산서 상세 조회",
    description="세금계산서 상세 정보를 조회합니다.",
    response={200: NationalTaxServiceOut, 404: dict, 500: dict},
)
async def get_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함
    return tax_service


@router.patch(
    "/{tax_id}",
    summary="[C] 세금계산서 수정",
    description="국세청 API 세금계산서를 수정합니다.",
    response={200: NationalTaxServiceOut, 400: dict, 404: dict, 500: dict},
)
async def update_tax_invoice(request, tax_id: int, payload: NationalTaxServiceUpdateIn):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함

    # 세금계산서가 발행 상태가 아니면 오류
    if tax_service.publish_status == "published":
        raise HttpError(400, "발행된 세금계산서는 수정할 수 없습니다.")

    data = payload.dict(exclude_unset=True)
    factory_id = data.pop("factory")
    # 공장 소유권 검증
    if factory_id != tax_service.factory.id:
        raise HttpError(400, "세금계산서의 공장과 요청한 공장이 일치하지 않습니다.")

    client_id = data.pop("client", None)
    if client_id is not None:
        client = await get_factory_client_by_id(client_id, factory_id)
        tax_service.client = client

    product_ids = data.pop("product", None)
    if product_ids is not None:
        products = get_product_list_by_ids(product_ids, factory_id)
        await tax_service.product.aset(products)

    # line_items는 수정 시에만 업데이트
    line_items = data.pop("line_items", None)
    if line_items is not None:
        tax_service.line_items = line_items

    for attr, value in data.items():
        setattr(tax_service, attr, value)

    await tax_service.asave()

    tax_service = await NationalTaxService.objects.prefetch_related("product").aget(
        id=tax_service.id,
    )

    return tax_service


@router.delete(
    "/{tax_id}",
    summary="[C] 세금계산서 삭제",
    description="국세청 API 세금계산서를 삭제합니다.",
    response={204: None, 404: dict, 500: dict},
)
async def delete_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함

    await tax_service.adelete()
    return 204, None


@router.post(
    "{tax_id}/publish",
    summary="[C] 세금계산서 발행",
    description="국세청 API 세금계산서를 발행합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def publish_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함
    # 세금계산서가 발행 상태가 아니면 오류
    if tax_service.publish_status != "temporary":
        raise HttpError(400, "세금계산서를 발행할 수 있는 상태가 아닙니다.")

    # 바로빌 API
    issue_barobill_tax_invoice(
        tax_service, tax_service.factory, tax_service.client, user
    )

    # 발행 상태 업데이트
    tax_service.publish_status = "published"
    await tax_service.asave()

    return {"message": "세금계산서가 발행되었습니다."}


# Tax Tab
# Material, Tax Tab
@router.get(
    "/published",
    summary="[C] 발행된 모든 세금계산서 조회",
    description="조건에 따라 세금계산서를 조회합니다.",
    response={200: List[AllTaxInvoiceOut], 400: dict, 500: dict},
)
@paginate
async def list_published_tax_invoices(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    q: str = Query(None, description="거래처명 또는 품목명 통합 검색어"),
    tax_invoice_type: str = Query(
        "all", description="세금계산서 유형: all(전체), sales(매출), purchase(매입)"
    ),
    start_date: date = Query(None, description="시작일"),
    end_date: date = Query(None, description="종료일"),
    order: str = Query(
        "desc", description="작성일자 정렬: desc(최신순), asc(오래된순)"
    ),
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
            qs = NationalTaxService.objects.filter(
                client__factory_id=factory_id, publish_status="published"
            ).prefetch_related("client", "product")

            if tax_invoice_type == "sales":
                qs = qs.filter(tax_invoice_type="sales")
            elif tax_invoice_type == "purchase":
                qs = qs.filter(tax_invoice_type="purchase")
            # "all"이면 필터 없음

            if q:
                ids_client = list(
                    qs.filter(client__name__icontains=q).values_list("id", flat=True)
                )
                ids_product = list(
                    qs.filter(product__name__icontains=q).values_list("id", flat=True)
                )
                ids = set(ids_client) | set(ids_product)
                qs = qs.filter(id__in=ids)

            if start_date:
                qs = qs.filter(transaction_date__gte=start_date)
            if end_date:
                qs = qs.filter(transaction_date__lte=end_date)
            if order == "asc":
                qs = qs.order_by("transaction_date")
            else:
                qs = qs.order_by("-transaction_date")

            return list(qs.distinct())

        invoices = await get_all_tax_invoices()
        result = []
        for invoice in invoices:
            product_names = [product.name for product in invoice.product.all()]
            total_amount = invoice.transaction_amount + invoice.tax_amount
            tax_invoice_type_map = {"sales": "매출", "purchase": "매입"}
            tax_invoice_type_kr = tax_invoice_type_map.get(
                invoice.tax_invoice_type, invoice.tax_invoice_type
            )
            result.append(
                AllTaxInvoiceOut(
                    id=invoice.id,
                    tax_invoice_type=tax_invoice_type_kr,
                    transaction_date=invoice.transaction_date,
                    client_name=invoice.client.name,
                    product_names=product_names,
                    transaction_amount=invoice.transaction_amount,
                    tax_amount=invoice.tax_amount,
                    total_amount=total_amount,
                )
            )
        return result
    except Exception as e:
        raise HttpError(500, f"세금계산서 조회 중 내부 서버 오류가 발생했습니다: {e}")


# Tax Tab
@router.get(
    "/pending",
    summary="[C] 발행대기/임시저장 세금계산서 조회",
    description="발행대기 또는 임시저장 상태의 세금계산서를 조회합니다.",
    response={200: List[AllTaxInvoiceOut], 400: dict, 500: dict},
)
@paginate
async def list_pending_tax_invoices(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    q: str = Query(None, description="거래처명 또는 품목명 통합 검색어"),
    publish_status: str = Query(
        "all",
        description="세금계산서 상태: all(전체), pending(발행대기), temporary(임시저장)",
    ),
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
            qs = (
                NationalTaxService.objects.filter(client__factory_id=factory_id)
                .prefetch_related("client", "product")
                .order_by("-transaction_date")
            )

            # 상태 필터
            if publish_status == "pending":
                qs = qs.filter(publish_status="pending")
            elif publish_status == "temporary":
                qs = qs.filter(publish_status="temporary")
            else:  # all
                qs = qs.filter(publish_status__in=["pending", "temporary"])

            # 통합 검색
            if q:
                ids_client = list(
                    qs.filter(client__name__icontains=q).values_list("id", flat=True)
                )
                ids_product = list(
                    qs.filter(product__name__icontains=q).values_list("id", flat=True)
                )
                ids = set(ids_client) | set(ids_product)
                qs = qs.filter(id__in=ids)

            return list(qs.distinct())

        invoices = await get_pending_tax_invoices()
        result = []
        for invoice in invoices:
            product_names = [product.name for product in invoice.product.all()]
            total_amount = invoice.transaction_amount + invoice.tax_amount
            tax_invoice_type_map = {"sales": "매출", "purchase": "매입"}
            tax_invoice_type_kr = tax_invoice_type_map.get(
                invoice.tax_invoice_type, invoice.tax_invoice_type
            )
            result.append(
                AllTaxInvoiceOut(
                    id=invoice.id,
                    tax_invoice_type=tax_invoice_type_kr,
                    transaction_date=invoice.transaction_date,
                    client_name=invoice.client.name,
                    product_names=product_names,
                    transaction_amount=invoice.transaction_amount,
                    tax_amount=invoice.tax_amount,
                    total_amount=total_amount,
                )
            )
        return result
    except Exception as e:
        raise HttpError(500, f"세금계산서 조회 중 내부 서버 오류가 발생했습니다: {e}")


# Tax Tab
@router.get(
    "/unlinked",
    summary="[C] 연동되지 않은 세금계산서 조회",
    description="연동되지 않은 세금계산서를 모두 조회합니다.",
    response={200: List[NotLinkedTaxInvoiceOut], 400: dict, 500: dict},
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
            qs = (
                NationalTaxService.objects.filter(
                    projects__isnull=True, client__factory_id=factory_id
                )
                .prefetch_related("client", "product")
                .order_by("-transaction_date")
            )
            if q:
                qs = qs.filter(client__name__icontains=q)
            return list(qs)

        invoices = await get_unlinked_tax_invoices()
        result = []
        for invoice in invoices:
            product_names = [product.name for product in invoice.product.all()]
            total_amount = invoice.transaction_amount + invoice.tax_amount
            tax_invoice_type_map = {"sales": "매출", "purchase": "매입"}
            tax_invoice_type_kr = tax_invoice_type_map.get(
                invoice.tax_invoice_type, invoice.tax_invoice_type
            )
            result.append(
                NotLinkedTaxInvoiceOut(
                    id=invoice.id,
                    tax_invoice_type=tax_invoice_type_kr,
                    transaction_date=invoice.transaction_date,
                    client_name=invoice.client.name,
                    product_names=product_names,
                    transaction_amount=invoice.transaction_amount,
                    tax_amount=invoice.tax_amount,
                    total_amount=total_amount,
                )
            )
        return result
    except Exception as e:
        raise HttpError(
            500, "연동되지 않은 세금계산서 조회 중 내부 서버 오류가 발생했습니다."
        )


# Project Tab
@router.post(
    "/link",
    summary="[C] 선택된 세금계산서 연결",
    description="선택된 세금계산서를 프로젝트에 연결합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict},
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

            # 프로젝트 존재 확인
            try:
                project = Project.objects.get(id=payload.project_id)
            except Project.DoesNotExist:
                raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

            # 세금계산서 존재 확인
            try:
                tax_invoice = NationalTaxService.objects.get(id=payload.tax_id)
            except NationalTaxService.DoesNotExist:
                raise HttpError(
                    404, f"세금계산서 ID {payload.tax_id}를 찾을 수 없습니다."
                )

            # 이미 다른 프로젝트에 연결되어 있는지 확인
            if tax_invoice.projects.exists():
                raise HttpError(
                    400,
                    f"세금계산서 ID {payload.tax_id}는 이미 다른 프로젝트에 연결되어 있습니다.",
                )

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


@router.get(
    "/receipt",
    summary="[C] 현금영수증 검색/조회",
    description="공장, 거래처명(q), 기간, 정렬로 현금영수증 검색",
    response={200: list[AllCashReceiptOut], 400: dict, 500: dict},
)
@paginate
async def list_cash_receipts(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    q: str = Query(None, description="거래처명 또는 품목명 통합 검색어"),
    start_date: date = Query(None, description="시작일"),
    end_date: date = Query(None, description="종료일"),
    order: str = Query(
        "desc", description="작성일자 정렬: desc(최신순), asc(오래된순)"
    ),
):
    """
    입력 필드(쿼리 파라미터):
    - factory_id: 공장 ID (필수)
    - q: 거래처명 또는 품목명 통합 검색어 (선택)
    - start_date: 조회 시작일 (YYYY-MM-DD, 선택)
    - end_date: 조회 종료일 (YYYY-MM-DD, 선택)
    - order: 작성일자 정렬(desc: 최신순, asc: 오래된순, 기본값 desc)

    반환 필드(각 영수증별 dict):
    - id: 영수증 ID (int)
    - transaction_date: 거래일자 (str, ISO8601)
    - client_name: 업체명 (str)
    - product_names: 품목명 리스트 (List[str])
    - transaction_amount: 공급가액 (int)
    - tax_amount: 세액 (int)
    - total_amount: 합계금액 (int)
    """
    try:

        @sync_to_async
        def get_filtered_receipts():
            qs = CashReceipt.objects.filter(
                client__factory_id=factory_id
            ).prefetch_related("client", "product")
            if q:
                ids_client = list(
                    qs.filter(client__name__icontains=q).values_list("id", flat=True)
                )
                ids_product = list(
                    qs.filter(product__name__icontains=q).values_list("id", flat=True)
                )
                ids = set(ids_client) | set(ids_product)
                qs = qs.filter(id__in=ids)
            if start_date:
                qs = qs.filter(transaction_date__gte=start_date)
            if end_date:
                qs = qs.filter(transaction_date__lte=end_date)
            if order == "asc":
                qs = qs.order_by("transaction_date")
            else:
                qs = qs.order_by("-transaction_date")
            return list(qs.distinct())

        receipts = await get_filtered_receipts()
        result = []
        for receipt in receipts:
            product_names = [product.name for product in receipt.product.all()]
            total_amount = receipt.transaction_amount + receipt.tax_amount
            result.append(
                AllCashReceiptOut(
                    id=receipt.id,
                    transaction_date=receipt.transaction_date,
                    client_name=receipt.client.name,
                    product_names=product_names,
                    transaction_amount=receipt.transaction_amount,
                    tax_amount=receipt.tax_amount,
                    total_amount=total_amount,
                )
            )
        return result
    except Exception as e:
        raise HttpError(500, f"현금영수증 검색 중 오류: {e}")


# Material Tab
@router.get(
    "/invoice-by-material-history",
    summary="[C] 자재 이력별 세금계산서 및 구매정보 조회",
    description="material_history_id로 세금계산서(구매) 및 자재정보를 조회",
    response={200: TaxInvoiceByMaterialOut, 404: dict, 500: dict},
)
async def get_tax_invoice_by_material_history(request, material_history_id: int):
    """
    입력 필드(쿼리 파라미터):
    - material_history_id: 원자재 이력 ID (필수)

    반환 필드(dict):
    - client_name: 업체명 (str)
    - business_registration_number: 사업자등록번호 (str)
    - representative_name: 대표자명 (str/null)
    - business_type: 업태 (str/null)
    - business_category: 종목 (str/null)
    - address: 사업장 주소 (str/null)
    - transaction_date: 작성일자 (date)
    - tax_invoice_type: 문서상태(매입/매출) (str)
    - transaction_type: 구분 (str)
    - materials: 구매 자재 정보 리스트(List[dict], 1건)
      - material_name: 자재명 (str)
      - spec: 규격 (str)
      - quantity: 수량 (int)
      - unit: 단위 (str)
      - price: 단가 (int)
      - transaction_amount: 공급가액 (int)
      - tax_amount: 세액 (int)
    """
    from stock.models import MaterialHistory

    try:

        def get_invoice_data(material_history_id):
            try:
                h = MaterialHistory.objects.select_related(
                    "purchase_tax_invoice", "material", "client"
                ).get(id=material_history_id)
            except MaterialHistory.DoesNotExist:
                return None
            invoice = h.purchase_tax_invoice
            if not invoice:
                return None
            client = invoice.client
            return dict(
                client_name=client.name,
                business_registration_number=client.business_registration_number,
                representative_name=client.representative_name,
                business_type=client.business_type,
                business_category=client.business_category,
                address=client.address,
                transaction_date=invoice.transaction_date,
                tax_invoice_type=(
                    "매입" if invoice.tax_invoice_type == "purchase" else "매출"
                ),
                transaction_type=(
                    "영수" if invoice.transaction_type == "receipt" else "청구"
                ),
                materials=[
                    dict(
                        material_name=h.material.name,
                        spec=h.material.spec,
                        quantity=h.quantity,
                        unit=h.material.unit,
                        price=h.price or 0,
                        transaction_amount=invoice.transaction_amount,
                        tax_amount=invoice.tax_amount,
                    )
                ],
            )

        raw_data = await sync_to_async(get_invoice_data)(material_history_id)
        if not raw_data:
            raise HttpError(404, "해당 이력에 연결된 세금계산서가 없습니다.")
        return TaxInvoiceByMaterialOut(**raw_data)
    except Exception as e:
        raise HttpError(500, f"자재 이력별 세금계산서 조회 중 오류: {e}")


@router.get(
    "/receipt-by-material-history",
    summary="[C] 자재 이력별 현금영수증 및 구매정보 조회",
    description="material_history_id로 현금영수증 및 자재정보를 조회",
    response={200: CashReceiptByMaterialOut, 404: dict, 500: dict},
)
async def get_cash_receipt_by_material_history(request, material_history_id: int):
    """
    입력 필드(쿼리 파라미터):
    - material_history_id: 원자재 이력 ID (필수)

    반환 필드(dict):
    - transaction_date: 거래일자 (date)
    - approval_number: 승인번호 (str)
    - transaction_classification: 거래구분 (str)
    - transaction_purpose: 거래용도 (str)
    - client_name: 업체명 (str)
    - business_registration_number: 사업자등록번호 (str)
    - representative_name: 대표자명 (str/null)
    - address: 사업장 주소 (str/null)
    - materials: 구매 자재 정보 리스트(List[dict], 1건)
      - material_name: 자재명 (str)
      - unit: 단위 (str)
      - quantity: 수량 (int)
      - price: 단가 (int)
      - transaction_amount: 공급가액 (int)
      - tax_amount: 세액 (int)
      - total_amount: 합계금액 (int)
    """
    from stock.models import MaterialHistory

    try:

        def get_receipt_data(material_history_id):
            try:
                h = MaterialHistory.objects.select_related(
                    "cash_receipt", "material", "client"
                ).get(id=material_history_id)
            except MaterialHistory.DoesNotExist:
                return None
            receipt = h.cash_receipt
            if not receipt:
                return None
            client = receipt.client
            total_amount = receipt.transaction_amount + receipt.tax_amount
            return dict(
                transaction_date=receipt.transaction_date,
                approval_number=receipt.approval_number,
                transaction_classification=receipt.transaction_classification,
                transaction_purpose=receipt.transaction_purpose,
                client_name=client.name,
                business_registration_number=client.business_registration_number,
                representative_name=client.representative_name,
                address=client.address,
                materials=[
                    dict(
                        material_name=h.material.name,
                        unit=h.material.unit,
                        quantity=h.quantity,
                        price=h.price or 0,
                        transaction_amount=receipt.transaction_amount,
                        tax_amount=receipt.tax_amount,
                        total_amount=total_amount,
                    )
                ],
            )

        raw_data = await sync_to_async(get_receipt_data)(material_history_id)
        if not raw_data:
            raise HttpError(404, "해당 이력에 연결된 현금영수증이 없습니다.")
        return CashReceiptByMaterialOut(**raw_data)
    except Exception as e:
        raise HttpError(500, f"자재 이력별 현금영수증 조회 중 오류: {e}")
