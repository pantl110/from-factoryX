# Factory ID 19 데이터 마이그레이션 계획

## 개요
- **소스 DB**: `postgresql://neondb_owner:npg_xn6JVGN2ozFU@ep-restless-snow-a10dhrj7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **타겟 DB**: `postgresql://neondb_owner:npg_xn6JVGN2ozFU@ep-bitter-field-a1yv5ctf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **대상**: Factory ID 19와 연결된 모든 데이터

## 마이그레이션 전략

### 1단계: 의존성 분석 및 마이그레이션 순서 결정

Factory와 직접/간접적으로 연결된 모든 모델을 의존성 순서대로 마이그레이션해야 합니다.

#### 직접 연결 모델 (Factory FK 직접)
1. `factory_factory` (id=19)
2. `factory_factoryequipment` (factory_id=19)
3. `factory_factoryclient` (factory_id=19)
4. `factory_factorymember` (factory_id=19)
5. `stock_product` (factory_id=19)
6. `stock_material` (factory_id=19)
7. `document_quotation` (factory_id=19)
8. `document_workinstruction` (factory_id=19)
9. `tax_nationaltaxservice` (factory_id=19)
10. `tax_cashreceipt` (factory_id=19)
11. `subscription_subscriptionhistory` (factory_id=19)
12. `subscription_paymentauth` (factory_id=19)
13. `unit_conversion_unitconversion` (factory_id=19)
14. `substitute_substitute` (factory_id=19)

#### 간접 연결 모델 (Factory를 거쳐서 연결)
15. `stock_materialhistory` (material_id -> material.factory_id=19)
16. `stock_materialproduct` (material_id 또는 product_id -> factory_id=19)
17. `stock_producthistory` (product_id -> product.factory_id=19)
18. `document_quotationproduct` (quotation_id -> quotation.factory_id=19 또는 product_id -> product.factory_id=19)
19. `document_workinstructionhistory` (work_instruction_id -> work_instruction.factory_id=19)
20. `project_project` (quotation_id -> quotation.factory_id=19)
21. `project_projectplan` (project_id -> project.quotation_id -> quotation.factory_id=19, equipment_id -> equipment.factory_id=19)
22. `project_projectlog` (project_id -> project.quotation_id -> quotation.factory_id=19)
23. `project_refund` (product_id -> product.factory_id=19 또는 plan_id -> plan.project_id -> project.quotation_id -> quotation.factory_id=19)
24. `stock_materialusage` (plan_id -> plan.project_id -> project.quotation_id -> quotation.factory_id=19, material_id -> material.factory_id=19)
25. `tax_taxinvoiceaccount` (tax_invoice_id -> tax_invoice.factory_id=19 또는 cash_receipt_id -> cash_receipt.factory_id=19)
26. `tax_paymentdetail` (tax_invoice_account_id -> tax_invoice_account -> tax_invoice.factory_id=19)
27. `subscription_payment` (subscription_history_id -> subscription_history.factory_id=19)
28. `notification_notification` (receiver_id -> factory_member.factory_id=19)
29. `location_location` (member_id -> factory_member.factory_id=19)
30. `repackaging_materialrepackaging` (parent_history_id -> material_history.material_id -> material.factory_id=19)

#### ManyToMany 관계
- `stock_material.location` (ManyToMany)
- `stock_product.location` (ManyToMany)
- `substitute_substitute.target_materials` (ManyToMany)
- `document_workinstruction.plans` (ManyToMany)

### 2단계: 외래키 참조 해결 전략

#### 문제점
- 타겟 DB에 이미 존재하는 ID와 충돌 가능
- User, Subscription 등 공유 모델의 참조 문제
- ManyToMany 관계 처리

#### 해결 방안
1. **ID 재매핑 테이블 생성**: 소스 ID -> 타겟 ID 매핑 저장
2. **순차적 마이그레이션**: 의존성 순서대로 마이그레이션
3. **외래키 업데이트**: 마이그레이션 후 외래키 ID 업데이트
4. **ManyToMany 처리**: 마이그레이션 후 별도로 처리

### 3단계: 마이그레이션 스크립트 구조

```python
# migration_script.py 구조 예시

# 1. DB 연결 설정
SOURCE_DB = "postgresql://..."
TARGET_DB = "postgresql://..."

# 2. ID 매핑 딕셔너리
id_mappings = {
    'factory_factory': {},
    'factory_factoryequipment': {},
    'factory_factoryclient': {},
    # ... 모든 테이블
}

# 3. 마이그레이션 함수들
def migrate_factory():
    """Factory 직접 마이그레이션"""
    pass

def migrate_direct_relations():
    """Factory 직접 FK 모델들"""
    pass

def migrate_indirect_relations():
    """간접 연결 모델들"""
    pass

def migrate_many_to_many():
    """ManyToMany 관계 처리"""
    pass

def update_foreign_keys():
    """외래키 ID 업데이트"""
    pass
```

### 4단계: 상세 마이그레이션 순서

#### Phase 1: 핵심 엔티티
1. `factory_factory` (id=19)
   - 주의: owner_id는 User 테이블 참조 (타겟 DB에 존재해야 함)
   - 타겟 DB에 동일 ID로 생성 또는 새 ID 할당

2. `factory_factorymember` (factory_id=19)
   - user_id, invited_by_id는 User 테이블 참조
   - factory_id는 위에서 마이그레이션한 Factory ID로 매핑

3. `factory_factoryequipment` (factory_id=19)
   - factory_id 매핑

4. `factory_factoryclient` (factory_id=19)
   - factory_id 매핑

#### Phase 2: 재고 관련
5. `stock_material` (factory_id=19)
   - location ManyToMany는 나중에 처리

6. `stock_product` (factory_id=19)
   - location ManyToMany는 나중에 처리

7. `stock_materialhistory` (material_id -> material.factory_id=19)
   - material_id, client_id, cash_receipt_id, purchase_tax_invoice_id 매핑 필요

8. `stock_producthistory` (product_id -> product.factory_id=19)
   - product_id 매핑

9. `stock_materialproduct` (material_id 또는 product_id)
   - material_id, product_id 매핑

10. `repackaging_materialrepackaging` (parent_history_id)
    - parent_history_id 매핑

#### Phase 3: 문서 관련
11. `document_quotation` (factory_id=19)
    - factory_id, client_id, project_id 매핑 (project는 나중에)

12. `document_quotationproduct` (quotation_id 또는 product_id)
    - quotation_id, product_id 매핑

13. `document_workinstruction` (factory_id=19)
    - factory_id 매핑
    - plans ManyToMany는 나중에

14. `document_workinstructionhistory` (work_instruction_id)
    - work_instruction_id, plan_id, changed_by_id 매핑

#### Phase 4: 프로젝트 관련
15. `project_project` (quotation_id -> quotation.factory_id=19)
    - quotation_id, tax_invoice_id 매핑

16. `project_projectplan` (project_id, equipment_id, product_id)
    - project_id, equipment_id, product_id 매핑

17. `project_projectlog` (project_id)
    - project_id, refund_id 매핑

18. `project_refund` (product_id, plan_id)
    - product_id, plan_id 매핑

19. `stock_materialusage` (plan_id, material_id)
    - plan_id, original_material_id, material_id, material_history_id, material_repackaging_id 매핑

#### Phase 5: 세금 관련
20. `tax_nationaltaxservice` (factory_id=19)
    - factory_id, user_id, client_id 매핑

21. `tax_cashreceipt` (factory_id=19)
    - factory_id, user_id, client_id 매핑

22. `tax_taxinvoiceaccount` (tax_invoice_id 또는 cash_receipt_id)
    - tax_invoice_id, cash_receipt_id 매핑

23. `tax_paymentdetail` (tax_invoice_account_id)
    - tax_invoice_account_id 매핑

#### Phase 6: 구독 관련
24. `subscription_subscriptionhistory` (factory_id=19)
    - factory_id, subscription_id 매핑 (subscription은 공유 모델일 수 있음)

25. `subscription_payment` (subscription_history_id)
    - subscription_history_id 매핑

26. `subscription_paymentauth` (factory_id=19)
    - factory_id 매핑

#### Phase 7: 기타
27. `notification_notification` (receiver_id -> factory_member.factory_id=19)
    - receiver_id 매핑

28. `location_location` (member_id -> factory_member.factory_id=19)
    - member_id 매핑

29. `unit_conversion_unitconversion` (factory_id=19)
    - factory_id, material_id, product_id 매핑

30. `substitute_substitute` (factory_id=19, source_material_id)
    - factory_id, source_material_id 매핑
    - target_materials ManyToMany는 나중에

#### Phase 8: ManyToMany 관계
31. `stock_material_location` (material_id, location_id)
32. `stock_product_location` (product_id, location_id)
33. `substitute_substitute_target_materials` (substitute_id, material_id)
34. `document_workinstruction_plans` (workinstruction_id, projectplan_id)

### 5단계: 주의사항 및 체크리스트

#### 필수 확인 사항
- [ ] 타겟 DB에 User 테이블이 존재하고 Factory.owner_id가 참조하는 User가 있는지 확인
- [ ] 타겟 DB에 Subscription 테이블이 존재하는지 확인
- [ ] 타겟 DB의 기존 데이터와 ID 충돌 여부 확인
- [ ] 타겟 DB에 동일한 Factory ID(19)가 이미 존재하는지 확인

#### 데이터 무결성 체크
- [ ] 모든 외래키 참조가 올바르게 매핑되었는지 확인
- [ ] ManyToMany 관계가 모두 복사되었는지 확인
- [ ] BaseModel의 created_at, updated_at 타임스탬프 보존
- [ ] JSONField 데이터 보존
- [ ] Unique 제약조건 확인 (예: factory+code 조합)

#### 롤백 계획
- [ ] 마이그레이션 전 타겟 DB 백업
- [ ] 트랜잭션 사용으로 원자성 보장
- [ ] 실패 시 롤백 스크립트 준비

### 6단계: 실행 방법

#### 옵션 1: Django Management Command
```python
# backend/factory/management/commands/migrate_factory_data.py
python manage.py migrate_factory_data --source-db-url="..." --target-db-url="..." --factory-id=19
```

#### 옵션 2: 독립 스크립트
```python
# scripts/migrate_factory_19.py
# Django 설정 로드 후 실행
```

#### 옵션 3: PostgreSQL 직접 쿼리
```sql
-- pg_dump로 특정 Factory 데이터 추출
-- psql로 타겟 DB에 삽입
-- 외래키 업데이트
```

### 7단계: 검증

#### 데이터 검증 쿼리
```sql
-- 소스 DB
SELECT COUNT(*) FROM factory_factory WHERE id = 19;
SELECT COUNT(*) FROM factory_factoryequipment WHERE factory_id = 19;
-- ... 각 테이블별 카운트

-- 타겟 DB
-- 동일한 쿼리로 비교
```

#### 관계 검증
- Factory -> FactoryEquipment 관계 수 확인
- Factory -> FactoryClient 관계 수 확인
- Factory -> Material -> MaterialHistory 체인 확인
- 등등...

## 예상 소요 시간
- 데이터 분석: 1-2시간
- 스크립트 작성: 2-4시간
- 테스트 실행: 1-2시간
- 실제 마이그레이션: 30분-2시간 (데이터 양에 따라)
- 검증: 1시간

## 리스크 및 대응
1. **ID 충돌**: 타겟 DB에 동일 ID 존재 시 새 ID 할당 필요
2. **외래키 무결성**: 순서대로 마이그레이션하여 해결
3. **ManyToMany 복잡성**: 별도 단계에서 처리
4. **대용량 데이터**: 배치 처리 필요
5. **트랜잭션 타임아웃**: 청크 단위로 처리

## 권장 접근 방법
1. **작은 테스트 먼저**: Factory ID 19의 데이터 샘플로 테스트
2. **단계별 검증**: 각 Phase 완료 후 검증
3. **백업 필수**: 마이그레이션 전 타겟 DB 백업
4. **로깅**: 모든 마이그레이션 작업 로깅
5. **에러 핸들링**: 실패 시 상세 에러 메시지와 롤백
