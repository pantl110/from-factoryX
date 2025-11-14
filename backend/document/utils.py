from ninja.errors import HttpError
from document.models import Quotation, QuotationProduct, WorkInstruction, WorkInstructionHistory

import json
import os
from pathlib import Path
from typing import Any, Dict, List
from datetime import datetime, date
from django.conf import settings
import pytz

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
        # return json.dumps(structured, ensure_ascii=False, indent=2)
        return structured
    except Exception as e:
        raise HttpError(500, f"OCR error: {str(e)}")


def create_work_instruction_history(
    plan,
    old_start_date,
    new_start_date,
    changed_by,
    old_values=None,
    new_values=None,
):
    """WorkInstruction에 연결된 Plan의 변경 이력을 기록하는 helper 함수"""
    today = datetime.now(pytz.timezone(settings.TIME_ZONE)).date()
    
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
        # 오늘 시작하는 plan이 수정되면 -> 수정
        action = WorkInstructionHistory.ActionType.updated
    elif old_start_date is None and new_start_date_is_today:
        # Plan이 새로 생성되어서 오늘 시작하게 되면 -> 추가
        action = WorkInstructionHistory.ActionType.added
    else:
        # 오늘과 관련 없는 변경이면 기록하지 않음
        return
    
    # 해당 Plan이 연결된 WorkInstruction 찾기
    # 추가/수정의 경우: new_start_date 기준으로 WorkInstruction 찾기
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
