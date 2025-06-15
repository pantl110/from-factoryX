import pandas as pd
import tempfile
import os
from django.shortcuts import get_object_or_404
from ninja import Router, File
from ninja.files import UploadedFile
from datetime import datetime
from quotationRequest.models import Contact, QuotationRequest, QuotationRequestItem
from quotationRequest.schemas.inbound import CreateQuotationRequestSchema, FileUploadResponseSchema
from quotationRequest.schemas.outbound import QuotationRequestResponseSchema

router = Router()

@router.post("/quotation-requests", response=QuotationRequestResponseSchema)
def create_quotation_request(request, payload: CreateQuotationRequestSchema):
    """
    견적 요청서를 생성합니다.
    """
    # 1. 연락처 생성 또는 조회
    contact_data = payload.contact.dict()
    contact, created = Contact.objects.get_or_create(
        business_registration_number=contact_data['business_registration_number'],
        defaults=contact_data
    )
    
    # 2. 견적 요청서 생성
    quotation_request = QuotationRequest.objects.create(
        contact=contact,
        due_date=payload.due_date,
        status=payload.status
    )
    
    # 3. 견적 요청 아이템 생성
    items = []
    for item_data in payload.items:
        item = QuotationRequestItem.objects.create(
            quotation_request=quotation_request,
            **item_data.dict()
        )
        items.append(item)
    
    # 4. 응답 데이터 구성
    response_data = {
        "id": quotation_request.id,
        "due_date": quotation_request.due_date.isoformat(),
        "created_at": quotation_request.created_at.isoformat(),
        "status": quotation_request.status,
        "contact": {
            "company_name": contact.company_name,
            "business_registration_number": contact.business_registration_number,
            "ceo_name": contact.ceo_name,
            "business_type": contact.business_type,
            "business_item": contact.business_item,
            "company_address": contact.company_address,
            "manager_name": contact.manager_name,
            "manager_email": contact.manager_email,
            "manager_phone": contact.manager_phone,
            "manager_fax": contact.manager_fax,
            "memo": contact.memo
        },
        "items": [
            {
                "item_name": item.item_name,
                "item_code": item.item_code,
                "specification": item.specification,
                "unit": item.unit,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
                "amount": item.amount
            }
            for item in items
        ]
    }
    
    return response_data

@router.post("/upload-quotation-file", response=FileUploadResponseSchema)
def upload_quotation_file(request, file: UploadedFile = File(...)):
    """
    견적서 파일을 업로드하여 분석한 후, 견적 요청서 데이터를 리턴합니다.
    Excel 파일을 지원합니다.
    """
    try:
        # 파일 확장자 체크
        filename = file.name.lower()
        if not filename.endswith(('.xlsx', '.xls')):
            return {
                "success": False,
                "message": "Excel 파일만 지원합니다 (.xlsx, .xls)",
                "data": None
            }
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as temp_file:
            temp_file.write(file.read())
            temp_path = temp_file.name
        
        # 엑셀 파일 읽기
        try:
            df = pd.read_excel(temp_path)
        finally:
            # 임시 파일 삭제
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        
        # 파일에서 데이터 추출 (샘플 - 실제 엑셀 구조에 맞게 수정 필요)
        # 연락처 정보 추출 - 값을 못 찾거나 오류 발생 시 빈칸으로 둠
        contact_data = {}
        try:
            contact_data = {
                "company_name": df.iloc[0]["회사명"] if "회사명" in df.columns and pd.notna(df.iloc[0]["회사명"]) else "",
                "business_registration_number": df.iloc[0]["사업자등록번호"] if "사업자등록번호" in df.columns and pd.notna(df.iloc[0]["사업자등록번호"]) else "",
                "ceo_name": df.iloc[0]["대표자명"] if "대표자명" in df.columns and pd.notna(df.iloc[0]["대표자명"]) else "",
                "business_type": df.iloc[0]["업태"] if "업태" in df.columns and pd.notna(df.iloc[0]["업태"]) else None,
                "business_item": df.iloc[0]["종목"] if "종목" in df.columns and pd.notna(df.iloc[0]["종목"]) else None,
                "company_address": df.iloc[0]["회사주소"] if "회사주소" in df.columns and pd.notna(df.iloc[0]["회사주소"]) else "",
                "manager_name": df.iloc[0]["담당자명"] if "담당자명" in df.columns and pd.notna(df.iloc[0]["담당자명"]) else "",
                "manager_email": df.iloc[0]["이메일"] if "이메일" in df.columns and pd.notna(df.iloc[0]["이메일"]) else "info@example.com",
                "manager_phone": df.iloc[0]["연락처"] if "연락처" in df.columns and pd.notna(df.iloc[0]["연락처"]) else "",
                "manager_fax": df.iloc[0]["팩스"] if "팩스" in df.columns and pd.notna(df.iloc[0]["팩스"]) else None,
                "memo": df.iloc[0]["비고"] if "비고" in df.columns and pd.notna(df.iloc[0]["비고"]) else None,
            }
        except Exception as e:
            print(f"연락처 정보 추출 중 오류: {str(e)}")
            # 오류 발생 시 빈 값으로 초기화
            contact_data = {
                "company_name": "",
                "business_registration_number": "",
                "ceo_name": "",
                "business_type": None,
                "business_item": None,
                "company_address": "",
                "manager_name": "",
                "manager_email": "info@example.com",
                "manager_phone": "",
                "manager_fax": None,
                "memo": None
            }
        
        # 견적 요청 아이템 추출
        items = []
        # 아이템 테이블 영역 추출 (실제 엑셀 구조에 맞게 수정 필요)
        try:
            item_df = df.iloc[3:] if len(df) > 3 else pd.DataFrame()
            
            for _, row in item_df.iterrows():
                try:
                    # 품목명 또는 품목코드가 있는 행만 처리
                    if pd.notna(row.get("품목명", None)) or pd.notna(row.get("품목코드", None)):
                        # 값이 없으면 빈 문자열, 숫자 필드는 0으로 설정
                        item_data = {
                            "item_name": str(row.get("품목명", "")) if pd.notna(row.get("품목명", None)) else "",
                            "item_code": str(row.get("품목코드", "")) if pd.notna(row.get("품목코드", None)) else "",
                            "specification": str(row.get("규격", "")) if pd.notna(row.get("규격", None)) else "",
                            "unit": str(row.get("단위", "")) if pd.notna(row.get("단위", None)) else "",
                            "unit_price": int(float(row.get("단가", 0))) if pd.notna(row.get("단가", None)) else 0,
                            "quantity": int(float(row.get("수량", 0))) if pd.notna(row.get("수량", None)) else 0,
                            "amount": int(float(row.get("금액", 0))) if pd.notna(row.get("금액", None)) else 0
                        }
                        items.append(item_data)
                except Exception as e:
                    print(f"아이템 행 처리 중 오류: {str(e)}")
                    # 오류 발생한 행은 건너뜀
                    continue
        except Exception as e:
            print(f"아이템 데이터 추출 중 오류: {str(e)}")
        
        # 견적서 데이터 구성
        try:
            due_date = ""
            # 납기일자 추출 시도
            try:
                if "납기일자" in df.columns and pd.notna(df.iloc[0]["납기일자"]):
                    due_date_val = df.iloc[0]["납기일자"]
                    if isinstance(due_date_val, datetime):
                        due_date = due_date_val.strftime("%Y-%m-%d")
                    else:
                        due_date = str(due_date_val)
            except:
                # 납기일자 추출 실패시 현재 날짜 사용
                pass
            
            if not due_date:
                due_date = datetime.now().strftime("%Y-%m-%d")
            
            quotation_data = {
                "contact": contact_data,
                "due_date": due_date,
                "status": "요청",
                "items": items
            }
            
            # 필수 항목 검증
            if not quotation_data["contact"]["company_name"]:
                return {
                    "success": False,
                    "message": "회사명이 파일에서 발견되지 않았습니다. 파일 형식을 확인해주세요.",
                    "data": quotation_data
                }
            
            # 아이템이 하나도 없는 경우
            if len(items) == 0:
                return {
                    "success": False,
                    "message": "품목 정보가 파일에서 발견되지 않았습니다. 파일 형식을 확인해주세요.",
                    "data": quotation_data
                }
            
            return {
                "success": True,
                "message": "견적서 파일 분석 완료",
                "data": quotation_data
            }
            
        except Exception as e:
            print(f"견적서 데이터 구성 중 오류: {str(e)}")
            return {
                "success": False,
                "message": f"견적서 데이터 처리 중 오류가 발생했습니다: {str(e)}",
                "data": None
            }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"파일 처리 중 오류가 발생했습니다: {str(e)}",
            "data": None
        }
