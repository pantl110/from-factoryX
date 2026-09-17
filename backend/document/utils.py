"""
document 앱 유틸: 견적서 조회, OCR(Upstage + LLM 구조화), 생산지시서 이력.
"""
from __future__ import annotations

import io
import json
import os
import re
from datetime import date, datetime
from typing import Any, Dict, List, Tuple

import fitz  # PyMuPDF
import requests
from dotenv import load_dotenv
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from ninja.errors import HttpError

from document.models import Quotation, QuotationProduct, WorkInstruction, WorkInstructionHistory

load_dotenv()


# -----------------------------------------------------------------------------
# Quotation
# -----------------------------------------------------------------------------


async def get_quotation_by_id(quotation_id: int, user):
    try:
        quotation = await Quotation.objects.aget(id=quotation_id, factory__owner=user)
        return quotation
    except Quotation.DoesNotExist:
        raise HttpError(404, "해당 견적서가 존재하지 않거나 접근 권한이 없습니다.")


async def get_quotation_product_by_id(qp_id: int, user):
    try:
        qp = await QuotationProduct.objects.aget(
            id=qp_id, quotation__factory__owner=user
        )
        return qp
    except QuotationProduct.DoesNotExist:
        raise HttpError(404, "해당 견적서 품목이 존재하지 않거나 접근 권한이 없습니다.")


# -----------------------------------------------------------------------------
# OCR (Upstage digitization + LLM 구조화)
# -----------------------------------------------------------------------------

# 견적서 구조화 스키마 키 (document.schemas.outbound.OCRClientInfoOut / OCRRequestItemOut 와 동일)
OCR_CLIENT_INFO_KEYS = (
    "company_name",
    "registration_number",
    "ceo_name",
    "delivery_date",
    "business_type",
    "category",
    "address",
    "manager_name",
    "email",
    "fax_number",
    "call_number",
)
OCR_REQUEST_ITEM_KEYS = ("item_name", "item_code", "spec", "unit", "quantity", "unit_price")

OCR_PARSE_ERROR_MESSAGE = (
    "OCR 결과를 정리하는 중 오류가 발생했습니다. "
)
LOCAL_OCR_TEST_DOCUMENT_MARKER = "PANTLE110 OCR TEST DOCUMENT"


def _ocr_filename_and_content_type(content: bytes) -> Tuple[str, str]:
    """파일 시그니처로 확장자와 Content-Type 결정. Upstage API 전송 시 사용."""
    if content.startswith(b"%PDF"):
        return "document.pdf", "application/pdf"
    if content.startswith(b"\xff\xd8\xff"):
        return "document.jpg", "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "document.png", "image/png"
    if content.startswith(b"GIF87a") or content.startswith(b"GIF89a"):
        return "document.gif", "image/gif"
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return "document.webp", "image/webp"
    return "document.pdf", "application/octet-stream"


def render_pdf_first_page_to_image(
    content: bytes, zoom: float = 2.0
) -> bytes:
    """
    PDF 바이트에서 첫 페이지를 PNG 이미지로 렌더링해 반환.

    - zoom: 렌더링 배율 (기본 2.0 ≒ A4를 적당히 선명하게 보기 좋은 크기)
    """
    try:
        doc = fitz.open(stream=content, filetype="pdf")
    except Exception as e:
        raise ValueError(f"PDF를 여는 중 오류가 발생했습니다: {e}") from e

    if len(doc) == 0:
        raise ValueError("페이지가 없는 PDF입니다.")

    page = doc[0]

    # 기본 72dpi 기준, zoom 배율로 렌더링 (예: 2.0 → 약 144dpi)
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)

    return pix.tobytes("png")


def _parse_local_test_order_text(
    text: str, document_type: str
) -> Dict[str, Any] | None:
    """개발 환경의 H 검증용 PDF에서만 주문 정보를 추출한다.

    외부 OCR 키가 없는 로컬 환경에서 이후 거래처·제품 연결 흐름을 검증하기
    위한 제한된 폴백이다. 일반 문서나 이미지에는 사용하지 않는다.
    """
    if (
        document_type != "order"
        or LOCAL_OCR_TEST_DOCUMENT_MARKER not in text
    ):
        return None

    party_pattern = re.compile(
        r"(?P<company>[^\n]+)\n"
        r"사업자등록번호:\s*(?P<registration_number>[^\n]+)\n"
        r"대표자:\s*(?P<ceo_name>[^\n]+)\n"
        r"주소:\s*(?P<address>[^\n]+)\n"
        r"담당자:\s*(?P<manager_name>[^/\n]+?)\s*/\s*(?P<call_number>[^\n]+)\n"
        r"이메일:\s*(?P<email>[^\n]+)"
    )
    parties = list(party_pattern.finditer(text))
    if len(parties) < 2:
        return None

    item_match = re.search(
        r"\n1\n(?P<item_code>[^\n]+)\n(?P<item_name>[^\n]+)\n"
        r"(?P<spec>[^\n]+)\n(?P<unit>[^\n]+)\n"
        r"(?P<quantity>[\d,.]+)\n(?P<unit_price>[\d,.]+)\n(?P<amount>[\d,.]+)",
        text,
    )
    if not item_match:
        return None

    buyer = parties[0].groupdict()
    due_date_match = re.search(r"납기요청일\s*(\d{4}-\d{2}-\d{2})", text)
    return {
        "client_info": {
            "company_name": buyer["company"].strip(),
            "registration_number": buyer["registration_number"].strip(),
            "ceo_name": buyer["ceo_name"].strip(),
            "delivery_date": due_date_match.group(1) if due_date_match else "",
            "business_type": "",
            "category": "",
            "address": buyer["address"].strip(),
            "manager_name": buyer["manager_name"].strip(),
            "email": buyer["email"].strip(),
            "fax_number": "",
            "call_number": buyer["call_number"].strip(),
        },
        "request_items": [
            {
                key: value.strip()
                for key, value in item_match.groupdict().items()
                if key != "amount"
            }
        ],
    }


def _parse_local_test_order_pdf(
    file: bytes, document_type: str
) -> Dict[str, Any] | None:
    if not file.startswith(b"%PDF"):
        return None

    try:
        document = fitz.open(stream=file, filetype="pdf")
        text = "\n".join(page.get_text("text") for page in document)
    except Exception:
        return None
    finally:
        if "document" in locals():
            document.close()

    return _parse_local_test_order_text(text, document_type)


def extract_text_from_upstage(digitize_json: Dict[str, Any]) -> str:
    """Upstage document-digitization 응답에서 텍스트만 추출.

    지원 패턴: pages[].text, top-level text, 그 외는 json.dumps.
    """
    if "pages" in digitize_json and isinstance(digitize_json["pages"], list):
        texts = [page.get("text", "") for page in digitize_json["pages"]]
        return "\n".join(texts).strip()
    if "text" in digitize_json and isinstance(digitize_json["text"], str):
        return digitize_json["text"].strip()
    return json.dumps(digitize_json, ensure_ascii=False)


def extract_text_from_upstage_document_parse(digitize_json: Dict[str, Any]) -> str:
    """Upstage document-parse 응답에서 HTML/Markdown 콘텐츠 추출.

    document-parse는 pages[].content에 구조화된 HTML/Markdown이 담겨 있음.
    """
    if "pages" in digitize_json and isinstance(digitize_json["pages"], list):
        contents = [page.get("content", page.get("text", "")) for page in digitize_json["pages"]]
        return "\n".join(contents).strip()
    if "content" in digitize_json and isinstance(digitize_json["content"], str):
        return digitize_json["content"].strip()
    return extract_text_from_upstage(digitize_json)


def _clean_json_string(raw: str) -> str:
    """LLM 출력 문자열을 표준 JSON 형태로 정제. 마크다운 코드블록·trailing comma 제거."""
    s = raw.strip()
    if s.startswith("```"):
        lines = s.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        s = "\n".join(lines)
    s = re.sub(r",\s*([}\]])", r"\1", s.strip())
    return s


def _normalize_parsed_quote(data: Dict[str, Any]) -> Dict[str, Any]:
    """json.loads 결과를 client_info / request_items 스키마 형태로 정규화."""
    client_info = data.get("client_info") or {}
    request_items = data.get("request_items") or []

    def _str(v: Any) -> str:
        return "" if v is None else str(v).strip()

    client = {k: _str(client_info.get(k, "")) for k in OCR_CLIENT_INFO_KEYS}
    items = [
        {k: _str(item.get(k, "")) for k in OCR_REQUEST_ITEM_KEYS}
        for item in request_items
        if isinstance(item, dict)
    ]
    return {"client_info": client, "request_items": items}


def parse_quote_text(
    text: str,
    document_type: str = "quotation",
    model_name: str = "gpt-3.5-turbo",
    temperature: float = 0,
) -> Dict[str, Any]:
    """Return structured JSON as python dict from free-form quote text."""
    if document_type == "order":
        client_role_instructions = """
    • 이 문서는 주문서입니다. client_info에는 발주자·구매자, 즉 우리 공장 관점의 수주처 정보만 추출하십시오.
      공급자·판매자·제조자 정보는 client_info에 넣지 마십시오.
      company_name부터 주소, 대표자, 담당자, 연락처까지 모든 필드는 반드시 같은 발주자 업체의 정보여야 하며 서로 다른 업체 정보를 섞지 마십시오.
    """
    else:
        client_role_instructions = """
    • client_info에는 견적을 요청한 고객사, 즉 우리 공장 관점의 수주처 정보만 추출하십시오.
      우리 공장·공급자 정보와 고객사 정보를 섞지 마십시오.
    """
    response_schemas: List[ResponseSchema] = [
        ResponseSchema(
            name="client_info",
            description=(
                "Dictionary with the following keys: "
                "company_name, registration_number, ceo_name, delivery_date, business_type, "
                "category, address, manager_name, email, fax_number. Values are strings."
            ),
        ),
        ResponseSchema(
            name="request_items",
            description=(
                "List of dictionaries. Each dict has keys: "
                "item_name, item_code, spec, unit, quantity, unit_price. Values are strings."
            ),
        ),
    ]
    parser = StructuredOutputParser.from_response_schemas(response_schemas)
    format_instructions: str = parser.get_format_instructions()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a helpful assistant that extracts structured information as JSON.",
            ),
            (
                "human",
                """
    다음 문서 OCR 결과에서 거래처 정보(client_info)와 요청 정보(request_items)를 추출하여 JSON 으로만 응답하십시오.

    {client_role_instructions}

    • client_info 는 업체당 1개의 dict 로, 아래 키를 모두 포함합니다.
      company_name, registration_number, ceo_name, delivery_date, business_type,
      category, address, manager_name, email, fax_number, call_number
      값이 없으면 빈 문자열로 설정합니다.

    • request_items 는 품목별 dict 들의 리스트이며, 각 dict 는 다음 키를 포함합니다.
      item_name, item_code, spec, unit, quantity, unit_price
      값이 없으면 빈 문자열로 설정합니다.
      item_name과 item_code는 문서의 품명·품번을 임의로 줄이거나 바꾸지 말고 가능한 그대로 복사하십시오.

    • 숫자 처리 및 컬럼 매핑 규칙 (quantity, unit_price)
      - quantity 와 unit_price 에는 문서에 적힌 숫자 문자열을 그대로 복사합니다.
      - 쉼표(,)와 온점(.)의 위치를 임의로 변경하거나 제거/추가하지 마십시오.
      - 예: 문서에 '5,044.00' 이 적혀 있으면, 출력도 반드시 '5,044.00' 이어야 합니다.
        '5044', '504,400', '5.044,00' 등으로 바꾸면 안 됩니다.
      - quantity 에는 수량 의미의 컬럼(예: '수량', 'QTY')의 값을 넣습니다.
      - unit_price 에는 단가/가격 의미의 컬럼(예: '단가', '단가(원)', 'Unit Price')의 값을 넣습니다.
      - '공급가액', '금액', '세액', '부가세' 등의 컬럼에 있는 값은 quantity 나 unit_price 에 절대 넣지 마십시오.
      - 예시 행:
        품목명 | 규격 | 수량 | 단가 | 공급가액 | 세액
        A     | ... | 100 | 5,040 | 504,000 | 50,400
        이 경우 JSON 은 quantity=\"100\", unit_price=\"5,040\" 이어야 하며,
        공급가액(504,000)이나 세액(50,400)을 quantity 또는 unit_price 로 사용하면 안 됩니다.
      - 가능하다면, 수량 × 단가 가 공급가액(또는 금액)과 비슷한 값이 되도록 숫자를 선택하십시오.

    다른 내용, 설명, 마크다운은 포함하지 마십시오.

    문서:
    ```
    {document}
    ```
    {format_instructions}
    """,
            ),
        ]
    )

    llm = ChatOpenAI(model_name=model_name, temperature=temperature)
    chain = prompt | llm
    result = chain.invoke(
        {
            "document": text,
            "format_instructions": format_instructions,
            "client_role_instructions": client_role_instructions,
        }
    )

    raw = getattr(result, "content", str(result))

    try:
        return parser.parse(result)
    except Exception:
        try:
            cleaned = _clean_json_string(raw)
            data = json.loads(cleaned)
            return _normalize_parsed_quote(data)
        except (json.JSONDecodeError, TypeError, KeyError):
            raise


def _is_ocr_parse_error(err_msg: str) -> bool:
    """LLM/파서 쪽 JSON 파싱 실패로 인한 오류인지 여부."""
    return (
        "invalid JSON" in err_msg
        or "Expecting value" in err_msg
        or "OutputParserException" in err_msg
    )


async def content_ocr(
    file: bytes, document_type: str = "quotation"
) -> Dict[str, Any]:
    """업로드 파일을 Upstage OCR 후 LLM으로 견적서 구조화. PDF·이미지 지원."""
    api_key = os.getenv("UPSTAGE_API_KEY")
    url = "https://api.upstage.ai/v1/document-digitization"
    headers = {"Authorization": f"Bearer {api_key}"}

    filename, content_type = _ocr_filename_and_content_type(file)
    files = {"document": (filename, io.BytesIO(file), content_type)}
    data = {"model": "ocr"}

    try:
        response = requests.post(url, headers=headers, files=files, data=data)
        digitize_json = response.json()
        text = extract_text_from_upstage(digitize_json)
        return parse_quote_text(text, document_type=document_type)
    except HttpError:
        raise
    except Exception as e:
        if _is_ocr_parse_error(str(e)):
            raise HttpError(500, OCR_PARSE_ERROR_MESSAGE) from e
        raise HttpError(500, f"OCR error: {str(e)}") from e


async def content_ocr_document_parse(
    file: bytes, document_type: str = "quotation"
) -> Dict[str, Any]:
    """업로드 파일을 Upstage document-parse 후 LLM으로 견적서 구조화. PDF·이미지 지원.

    document-parse는 표 구조를 HTML로 반환하여 LLM 파싱 정확도가 높음.
    """
    api_key = os.getenv("UPSTAGE_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")

    # 외부 비밀키 없이 현재 로컬에서 H 검증용 PDF의 후속 흐름을 확인할 수
    # 있도록 개발 모드에서만 제한적인 텍스트 PDF 폴백을 허용한다.
    if not api_key or not openai_api_key:
        if os.getenv("DJANGO_DEBUG", "").lower() == "true":
            fallback_result = _parse_local_test_order_pdf(file, document_type)
            if fallback_result is not None:
                return fallback_result
        raise HttpError(
            503,
            "외부 OCR 환경변수(UPSTAGE_API_KEY, OPENAI_API_KEY)가 설정되지 않았습니다.",
        )

    url = "https://api.upstage.ai/v1/document-digitization"
    headers = {"Authorization": f"Bearer {api_key}"}

    filename, content_type = _ocr_filename_and_content_type(file)
    files = {"document": (filename, io.BytesIO(file), content_type)}
    data = {"model": "document-parse-251217", "mode": "enhanced"}

    try:
        response = requests.post(url, headers=headers, files=files, data=data)
        digitize_json = response.json()
        text = extract_text_from_upstage_document_parse(digitize_json)
        return parse_quote_text(text, document_type=document_type)
    except HttpError:
        raise
    except Exception as e:
        if _is_ocr_parse_error(str(e)):
            raise HttpError(500, OCR_PARSE_ERROR_MESSAGE) from e
        raise HttpError(500, f"OCR error: {str(e)}") from e


# -----------------------------------------------------------------------------
# Work instruction history
# -----------------------------------------------------------------------------


def create_work_instruction_history(
    plan,
    old_start_date,
    new_start_date,
    changed_by,
    old_values=None,
    new_values=None,
):
    """WorkInstruction에 연결된 Plan의 변경 이력을 기록하는 helper 함수"""
    today = date.today()
    
    # Plan 수정 전/후의 start_date가 오늘 날짜인지 확인
    old_start_date_is_today = old_start_date.date() == today if old_start_date else False
    new_start_date_is_today = new_start_date.date() == today if new_start_date else False
    
    # action 결정
    action = None
    if not old_start_date_is_today and new_start_date_is_today:
        # 기존 plan이 수정되어서 오늘 시작하게 되면 -> 추가
        action = WorkInstructionHistory.ActionType.added
    elif old_start_date_is_today and not new_start_date_is_today:
        # 오늘 시작하는 plan이 수정되어서 오늘 시작이 아니게 바뀌면 -> 삭제
        action = WorkInstructionHistory.ActionType.removed
    elif old_start_date_is_today and new_start_date_is_today:
        # 오늘 시작하는 plan이 수정되어서 생산지시서에 들어오면 -> 추가 (수정이 아님)
        # Plan이 처음으로 생산지시서에 들어올 때는 항상 "추가"로 기록
        action = WorkInstructionHistory.ActionType.added
    elif old_start_date is None and new_start_date_is_today:
        # Plan이 새로 생성되어서 오늘 시작하게 되면 -> 추가
        action = WorkInstructionHistory.ActionType.added
    else:
        # 오늘과 관련 없는 변경이면 기록하지 않음
        return
    
    # 해당 Plan이 연결된 WorkInstruction 찾기
    # 추가의 경우: new_start_date 기준으로 WorkInstruction 찾기
    # 삭제의 경우: old_start_date 기준으로 WorkInstruction 찾기
    target_date = new_start_date.date() if new_start_date_is_today else (old_start_date.date() if old_start_date else today)
    
    work_instructions = WorkInstruction.objects.filter(
        factory_id=plan.equipment.factory_id,
        created_at__date=target_date,
    )
    
    if not work_instructions.exists():
        # WorkInstruction이 없으면 기록하지 않음 (스케줄러가 생성)
        return
    
    # 변경 내용 구성 (before_data, after_data)
    before_data = {}
    after_data = {}
    
    if old_values:
        for field, old_value in old_values.items():
            # datetime 객체를 문자열로 변환
            if isinstance(old_value, datetime):
                old_value = old_value.isoformat()
            # date 객체를 문자열로 변환
            if isinstance(old_value, date):
                old_value = old_value.isoformat()
            before_data[field] = old_value
        
        # equipment_id가 있으면 설비 이름도 함께 저장 (equipment_name이 없을 때만)
        if 'equipment_id' in before_data and before_data['equipment_id'] and 'equipment_name' not in before_data:
            try:
                from factory.models import FactoryEquipment
                old_equipment = FactoryEquipment.objects.filter(
                    id=before_data['equipment_id']
                ).first()
                if old_equipment:
                    before_data['equipment_name'] = old_equipment.name
            except Exception:
                pass
    
    if new_values:
        for field, new_value in new_values.items():
            # datetime 객체를 문자열로 변환
            if isinstance(new_value, datetime):
                new_value = new_value.isoformat()
            # date 객체를 문자열로 변환
            if isinstance(new_value, date):
                new_value = new_value.isoformat()
            after_data[field] = new_value
        
        # equipment_id가 있으면 설비 이름도 함께 저장 (equipment_name이 없을 때만)
        if 'equipment_id' in after_data and after_data['equipment_id'] and 'equipment_name' not in after_data:
            try:
                from factory.models import FactoryEquipment
                new_equipment = FactoryEquipment.objects.filter(
                    id=after_data['equipment_id']
                ).first()
                if new_equipment:
                    after_data['equipment_name'] = new_equipment.name
            except Exception:
                pass
    
    # 각 WorkInstruction에 대해 history 기록
    for work_instruction in work_instructions:
        WorkInstructionHistory.objects.create(
            work_instruction=work_instruction,
            plan=plan,
            action=action,
            changed_by=changed_by,
            before_data=before_data if before_data else None,
            after_data=after_data if after_data else None,
        )


def create_work_instruction_memo_history(
    work_instruction,
    old_memo,
    new_memo,
    changed_by,
):
    """WorkInstruction의 메모 변경 이력을 기록하는 helper 함수
    
    메모 수정은 오늘과 관련 없이 항상 기록됩니다.
    """
    WorkInstructionHistory.objects.create(
        work_instruction=work_instruction,
        plan=None,  # 메모는 WorkInstruction 자체의 필드이므로 plan은 None
        action=WorkInstructionHistory.ActionType.memo_updated,
        changed_by=changed_by,
        before_data={"memo": old_memo} if old_memo else {},
        after_data={"memo": new_memo} if new_memo else {},
    )
