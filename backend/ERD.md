# Factory X - Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% 사용자 및 회사 관련
    User {
        uuid id
        string username
        string email
        string status
        boolean is_staff
        boolean is_superuser
        datetime date_joined
    }
    
    Company {
        uuid id
        string name
        string business_registration_number
        string ceo_name
        string contact
        string business_type
        string business_item
        string address
    }
    
    UserCompanyInvitation {
        uuid id
        uuid user_id
        uuid company_id
        string invitation_status
        string permission
        datetime invited_date
    }
    
    Jwt {
        uuid id
        uuid user_id
        text access
        text refresh
    }
    
    %% 공통 모델
    Unit {
        uuid id
        string code
        string name
        text description
        boolean is_active
    }
    
    Memo {
        uuid id
        string memo_type
        string title
        text content
        datetime created_at
        datetime updated_at
    }
    
    %% 자재 관리
    Material {
        uuid id
        string name
        string code
        string specification
        string unit
        int current_stock
        int min_stock
        date expiration_date
        date received_date
        string warehouse_location
    }
    
    %% 품목 관리
    Item {
        uuid id
        string name
        string code
        string specification
        string unit
        int current_stock
        date expiration_date
        date received_date
        string warehouse_location
    }
    
    ItemMaterial {
        uuid id
        uuid item_id
        uuid material_id
        int quantity
    }
    
    Return {
        uuid id
        uuid item_id
        int return_quantity
        date return_date
    }
    
    %% 설비 관리
    Equipment {
        uuid id
        string status
        string name
        string type
        string location
        text special_notes
    }
    
    EquipmentItem {
        uuid id
        uuid equipment_id
        uuid item_id
        float production_time_per_unit
    }
    
    %% 프로젝트 관리
    Project {
        uuid id
        string status
        date execution_date
        date due_date
        date completed_date
    }
    
    ProjectItem {
        uuid id
        uuid project_id
        uuid item_id
        uuid equipment_id
        string operation_status
    }
    
    %% 견적 요청 관리
    Contact {
        uuid id
        string company_name
        string business_registration_number
        string ceo_name
        string business_type
        string business_item
        string company_address
        string manager_name
        string manager_email
        string manager_phone
        string manager_fax
        text memo
    }
    
    QuotationRequest {
        uuid id
        uuid contact_id
        date due_date
        date created_at
        string status
    }
    
    QuotationRequestItem {
        uuid id
        uuid quotation_request_id
        string item_name
        string item_code
        string specification
        string unit
        int unit_price
        int quantity
        int amount
    }
    
    %% 문서 관리 (구현 예정)
    Order {
        uuid id
    }
    
    ProductionInstruction {
        uuid id
    }
    
    TransactionStatement {
        uuid id
    }
    
    SalesTaxInvoice {
        uuid id
    }
    
    PurchaseTaxInvoice {
        uuid id
    }
    
    %% 관계 정의
    User ||--o{ UserCompanyInvitation : "invited_to"
    Company ||--o{ UserCompanyInvitation : "invites"
    User ||--|| Jwt : "has"
    
    Item ||--o{ ItemMaterial : "uses"
    Material ||--o{ ItemMaterial : "used_in"
    
    Item ||--o{ Return : "has_returns"
    
    Equipment ||--o{ EquipmentItem : "can_produce"
    Item ||--o{ EquipmentItem : "produced_by"
    
    Project ||--o{ ProjectItem : "contains"
    Item ||--o{ ProjectItem : "used_in_project"
    Equipment ||--o{ ProjectItem : "used_in_project"
    
    Contact ||--o{ QuotationRequest : "makes"
    QuotationRequest ||--o{ QuotationRequestItem : "contains"
```

## 주요 관계 설명

### 1. 사용자 관리
- **User ↔ Company**: M:N 관계 (UserCompanyInvitation 중간 테이블)
- **User ↔ Jwt**: 1:1 관계 (사용자당 하나의 JWT 토큰)
- **UserCompanyInvitation**: 초대 시스템 관리 (초대 상태, 권한, 초대일자)

### 2. 제조 관계
- **Item ↔ Material**: M:N 관계 (ItemMaterial 중간 테이블)
  - 하나의 품목은 여러 자재로 만들어짐
  - 하나의 자재는 여러 품목에 사용됨
  - ItemMaterial에서 필요 수량 관리

### 3. 설비 관계
- **Equipment ↔ Item**: M:N 관계 (EquipmentItem 중간 테이블)
  - 하나의 설비는 여러 품목 생산 가능
  - 하나의 품목은 여러 설비에서 생산 가능
  - EquipmentItem에서 단위당 생산시간 관리

### 4. 프로젝트 관리
- **Project ↔ Item**: M:N 관계 (ProjectItem 중간 테이블)
- **Project ↔ Equipment**: M:N 관계 (ProjectItem 중간 테이블)
- ProjectItem에서 가동상태 관리

### 5. 견적 요청
- **Contact ↔ QuotationRequest**: 1:N 관계
- **QuotationRequest ↔ QuotationRequestItem**: 1:N 관계

### 6. 기타
- **Item ↔ Return**: 1:N 관계 (품목별 반품 이력)
- **BaseModel**: Memo가 상속받아 created_at, updated_at 자동 관리

## 데이터 흐름
1. **제조 흐름**: Material → Item (ItemMaterial로 연결)
2. **생산 흐름**: Item → Equipment → Project (생산 계획)
3. **영업 흐름**: Contact → QuotationRequest → QuotationRequestItem
4. **재고 관리**: Item stock, Material stock, Return 관리
5. **초대 흐름**: Company → UserCompanyInvitation → User (이메일 초대 시스템)

## 사용자-회사 초대 시스템

### UserCompanyInvitation 테이블
사용자와 회사를 연결하는 중간 테이블로 초대 시스템을 관리합니다.

#### 초대 상태 (invitation_status)
- **대기중** (`pending`): 초대 이메일이 발송되어 사용자 확인 대기 중
- **완료** (`completed`): 사용자가 초대를 확인하여 회사 멤버가 됨
- **만료** (`expired`): 초대 기간이 지나서 만료됨

#### 권한 레벨 (permission)
- **시스템관리자** (`system_admin`): 회사 내 모든 권한
- **운영자** (`operator`): 일반 업무 처리 권한  
- **조회자** (`viewer`): 읽기 전용 권한

#### 초대 프로세스
1. **초대 생성**: 관리자가 사용자를 회사에 초대 → `대기중` 상태로 생성
2. **이메일 발송**: 시스템에서 초대 확인 이메일 발송
3. **사용자 확인**: 사용자가 이메일의 확인 링크 클릭 → `완료` 상태로 변경
4. **만료 처리**: 일정 기간 후 확인하지 않으면 → `만료` 상태로 변경

### User 모델의 회사 관련 메서드
```python
user.get_active_companies()           # 속한 활성 회사들
user.get_company_permission(company)  # 특정 회사에서의 권한
user.is_company_member(company)       # 회사 멤버인지 확인
user.get_pending_invitations()        # 대기중인 초대 목록
user.can_manage_company(company)      # 회사 관리 권한 확인
```
