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
import logging

import fitz  # PyMuPDF
import requests
from dotenv import load_dotenv
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from ninja.errors import HttpError

from document.models import Quotation, QuotationProduct, WorkInstruction, WorkInstructionHistory

load_dotenv()


# module-level logger
logger = logging.getLogger(__name__)


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
    text: str, model_name: str = "gpt-3.5-turbo", temperature: float = 0
) -> Dict[str, Any]:
    """Return structured JSON as python dict from free-form quote text."""
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
    다음 문서(견적서 OCR 결과)에서 거래처 정보(client_info)와 요청 정보(request_items)를 추출하여 JSON 으로만 응답하십시오.

    • client_info 는 업체당 1개의 dict 로, 아래 키를 모두 포함합니다.
      company_name, registration_number, ceo_name, delivery_date, business_type,
      category, address, manager_name, email, fax_number, call_number
      값이 없으면 빈 문자열로 설정합니다.

    • request_items 는 품목별 dict 들의 리스트이며, 각 dict 는 다음 키를 포함합니다.
      item_name, item_code, spec, unit, quantity, unit_price
      값이 없으면 빈 문자열로 설정합니다.

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
    result = chain.invoke({"document": text, "format_instructions": format_instructions})

    raw = getattr(result, "content", str(result))

    # 디버깅: LLM 원본 출력 일부 로깅
    try:
        logger.info("[OCR] LLM raw output sample: %s", raw[:500])
    except Exception:
        pass

    try:
        return parser.parse(result)
    except Exception:
        try:
            cleaned = _clean_json_string(raw)

            # 디버깅: 정제된 JSON 문자열 일부 로깅
            try:
                logger.info("[OCR] Cleaned JSON string sample: %s", cleaned[:500])
            except Exception:
                pass

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


async def content_ocr(file: bytes) -> Dict[str, Any]:
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

        # 디버깅: Upstage OCR 원본 응답 일부 로깅
        try:
            logger.info(
                "[OCR] Upstage response sample: %s",
                str(digitize_json)[:500],
            )
        except Exception:
            # 로깅 실패는 OCR 흐름에 영향을 주지 않음
            pass

        text = extract_text_from_upstage(digitize_json)

        # 디버깅: LLM에 전달되는 OCR 텍스트 일부 로깅
        try:
            logger.info(
                "[OCR] Extracted text sample: %s",
                text[:500],
            )
        except Exception:
            pass

        parsed = parse_quote_text(text)

        # 디버깅: 최종 품목별 수량/단가 요약 로깅
        try:
            for idx, item in enumerate(parsed.get("request_items", [])):
                logger.info(
                    "[OCR] Parsed item #%d: name=%s quantity=%s unit_price=%s",
                    idx,
                    item.get("item_name"),
                    item.get("quantity"),
                    item.get("unit_price"),
                )
        except Exception:
            pass

        return parsed
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
