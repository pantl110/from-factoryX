# Factory X - Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% 사용자 및 회사 관련
    User {
        id PK
        username string
        email string
        status string
        company_id FK
        is_staff boolean
        is_superuser boolean
        date_joined datetime
    }
    
    Company {
        id PK
        name string
        business_registration_number string
        ceo_name string
        contact string
        business_type string
        business_item string
        address string
    }
    
    Jwt {
        id PK
        user_id FK
        access text
        refresh text
    }
    
    %% 공통 모델
    Unit {
        id PK
        code string
        name string
        description text
        is_active boolean
    }
    
    Memo {
        id PK
        memo_type string
        title string
        content text
        created_at datetime
        updated_at datetime
    }
    
    %% 자재 관리
    Material {
        id PK
        name string
        code string
        specification string
        unit string
        current_stock integer
        min_stock integer
        expiration_date date
        received_date date
        warehouse_location string
    }
    
    %% 품목 관리
    Item {
        id PK
        name string
        code string
        specification string
        unit string
        current_stock integer
        expiration_date date
        received_date date
        warehouse_location string
    }
    
    ItemMaterial {
        id PK
        item_id FK
        material_id FK
        quantity integer
    }
    
    Return {
        id PK
        item_id FK
        return_quantity integer
        return_date date
    }
    
    %% 설비 관리
    Equipment {
        id PK
        status string
        name string
        type string
        location string
        special_notes text
    }
    
    EquipmentItem {
        id PK
        equipment_id FK
        item_id FK
        production_time_per_unit float
    }
    
    %% 프로젝트 관리
    Project {
        id PK
        status string
        execution_date date
        due_date date
        completed_date date
    }
    
    ProjectItem {
        id PK
        project_id FK
        item_id FK
        equipment_id FK
        operation_status string
    }
    
    %% 견적 요청 관리
    Contact {
        id PK
        company_name string
        business_registration_number string
        ceo_name string
        business_type string
        business_item string
        company_address string
        manager_name string
        manager_email string
        manager_phone string
        manager_fax string
        memo text
    }
    
    QuotationRequest {
        id PK
        contact_id FK
        due_date date
        created_at date
        status string
    }
    
    QuotationRequestItem {
        id PK
        quotation_request_id FK
        item_name string
        item_code string
        specification string
        unit string
        unit_price integer
        quantity integer
        amount integer
    }
    
    %% 문서 관리 (구현 예정)
    Order {
        id PK
    }
    
    ProductionInstruction {
        id PK
    }
    
    TransactionStatement {
        id PK
    }
    
    SalesTaxInvoice {
        id PK
    }
    
    PurchaseTaxInvoice {
        id PK
    }
    
    %% 관계 정의
    Company ||--o{ User : "has"
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
- **User ↔ Company**: 1:N 관계 (한 회사에 여러 사용자)
- **User ↔ Jwt**: 1:1 관계 (사용자당 하나의 JWT 토큰)

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
