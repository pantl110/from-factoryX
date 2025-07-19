from ninja.errors import HttpError
from document.models import Quotation, QuotationProduct

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import aiohttp
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import requests

load_dotenv()


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


def extract_text_from_upstage(digitize_json: Dict[str, Any]) -> str:
    """Extract concatenated text from Upstage digitization response.

    The response structure may vary. This function tries common patterns:
    1. `pages`: list of dicts with `text` field.
    2. top-level `text` field.
    3. fallback to json.dumps if unsure.
    """
    if "pages" in digitize_json and isinstance(digitize_json["pages"], list):
        texts = [page.get("text", "") for page in digitize_json["pages"]]
        return "\n".join(texts).strip()
    if "text" in digitize_json and isinstance(digitize_json["text"], str):
        return digitize_json["text"].strip()
    # Fallback: dump the entire JSON (not ideal, but avoids crash)
    return json.dumps(digitize_json, ensure_ascii=False)


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
    chain = prompt | llm | parser
    return chain.invoke({"document": text, "format_instructions": format_instructions})


async def content_ocr(file):
    api_key = os.getenv("UPSTAGE_API_KEY")

    try:
        url = "https://api.upstage.ai/v1/document-digitization"
        headers = {"Authorization": f"Bearer {api_key}"}

        files = {"document": file}
        data = {"model": "ocr"}
        response = requests.post(url, headers=headers, files=files, data=data)
        # print(response.json())
        text = extract_text_from_upstage(response.json())
        structured = parse_quote_text(text)
        return json.dumps(structured, ensure_ascii=False, indent=2)
    except Exception as e:
        raise HttpError(500, f"OCR error: {str(e)}")
