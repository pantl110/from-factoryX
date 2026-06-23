#!/usr/bin/env python3
"""
Factory ID 19 데이터 마이그레이션 스크립트

독립 실행 스크립트 (Django 없이 실행 가능)
"""
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from collections import defaultdict
import sys
import json

# DB 연결 정보
SOURCE_DB_URL = "postgresql://neondb_owner:npg_xn6JVGN2ozFU@ep-restless-snow-a10dhrj7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
TARGET_DB_URL = "postgresql://neondb_owner:npg_xn6JVGN2ozFU@ep-bitter-field-a1yv5ctf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
FACTORY_ID = 19

# ID 매핑 딕셔너리
id_mappings = defaultdict(dict)


def get_mapped_id(table_name, source_id):
    """소스 ID를 타겟 ID로 매핑"""
    if source_id is None:
        return None
    return id_mappings[table_name].get(source_id, source_id)


def migrate_table(
    source_cursor,
    target_cursor,
    table_name,
    where_clause,
    dry_run=False,
    fk_mappings=None,
    exclude_fields=None,
    temp_project_id=None,
):
    """테이블 마이그레이션 헬퍼 함수"""
    exclude_fields = exclude_fields or []
    fk_mappings = fk_mappings or {}
    
    # 소스에서 데이터 조회
    query = f"SELECT * FROM {table_name} WHERE {where_clause}"
    try:
        source_cursor.execute(query)
        rows = source_cursor.fetchall()
    except Exception as e:
        if "does not exist" in str(e) or "relation" in str(e).lower():
            print(f"  {table_name}: 테이블이 존재하지 않음 (건너뜀)")
            return 0
        raise

    if not rows:
        print(f"  {table_name}: 마이그레이션할 데이터 없음")
        return 0

    print(f"  {table_name}: {len(rows)}개 레코드 발견")

    if dry_run:
        for row in rows[:3]:  # 처음 3개만 표시
            print(f"    - ID {row.get('id')}: {dict(row)}")
        if len(rows) > 3:
            print(f"    ... 외 {len(rows) - 3}개")
        return len(rows)

    # 컬럼명 가져오기
    source_columns = [desc[0] for desc in source_cursor.description]
    source_columns = [c for c in source_columns if c not in exclude_fields]
    
    # 타겟 DB의 실제 컬럼 목록 확인
    target_cursor.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name.split('.')[-1]}'
        ORDER BY ordinal_position
    """)
    target_columns = [row['column_name'] for row in target_cursor.fetchall()]
    
    # 소스와 타겟 모두에 있는 컬럼만 사용
    columns = [c for c in source_columns if c in target_columns]
    
    # 타겟에 없는 컬럼이 있으면 경고
    missing_in_target = [c for c in source_columns if c not in target_columns]
    if missing_in_target:
        print(f"    ⚠️ 타겟 DB에 없는 컬럼 제외: {', '.join(missing_in_target)}")

    inserted_count = 0
    for row in rows:
        # 각 레코드를 개별 트랜잭션으로 처리 (에러 발생 시 다른 레코드에 영향 없도록)
        try:
            source_id = row.get('id')
            
            # 외래키 매핑 (ID는 제외하고 새로 생성)
            values = {}
            for col in columns:
                if col == 'id':
                    # ID는 제외 - 새로 자동 생성
                    continue
                elif col in fk_mappings:
                    fk_table = fk_mappings[col]
                    original_value = row.get(col)
                    if original_value:
                        mapped_id = get_mapped_id(fk_table, original_value)
                        if mapped_id:  # 매핑된 ID가 있으면 사용
                            values[col] = mapped_id
                        else:
                            # 매핑된 ID가 없으면 NULL (참조 레코드가 아직 마이그레이션되지 않음)
                            values[col] = None
                    else:
                        values[col] = original_value
                else:
                    val = row.get(col)
                    # NOT NULL 필드에 대한 기본값 처리
                    if table_name == "user_user" and col == "language":
                        # language 필드는 항상 "ko"로 설정 (NULL, 빈 문자열, 또는 값이 없을 때)
                        if val is None or val == "" or val == "None":
                            values[col] = "ko"
                        else:
                            values[col] = val
                    elif table_name == "stock_materialhistory" and col == "lot_number":
                        # lot_number는 빈 문자열이면 자동 생성된 값으로 설정
                        if val is None or val == "":
                            import uuid
                            values[col] = f"LOT-{uuid.uuid4().hex[:8].upper()}"
                        else:
                            values[col] = val
                    elif val is None:
                        if table_name == "user_user" and col in ["first_name", "last_name", "username"]:
                            values[col] = ""  # 빈 문자열
                        else:
                            values[col] = val
                    else:
                        values[col] = val

            # JSONField 및 특수 타입 처리
            processed_values = {}
            for col, val in values.items():
                if isinstance(val, dict) or isinstance(val, list):
                    # JSONField는 Json 객체로 변환
                    processed_values[col] = Json(val)
                else:
                    processed_values[col] = val
            
            # 필수 필드 보장
            if table_name == "user_user":
                # language 필드가 없거나 NULL이면 "ko"로 설정
                if "language" not in processed_values or processed_values.get("language") is None or processed_values.get("language") == "":
                    processed_values["language"] = "ko"
            elif table_name == "stock_materialhistory":
                # lot_number 필드가 없거나 NULL/빈 문자열이면 자동 생성
                if "lot_number" not in processed_values or processed_values.get("lot_number") is None or processed_values.get("lot_number") == "":
                    import uuid
                    processed_values["lot_number"] = f"LOT-{uuid.uuid4().hex[:8].upper()}"
            elif table_name == "document_quotation":
                # project_id는 임시 Project ID로 설정됨 (Quotation 마이그레이션 전에 생성됨)
                if temp_project_id is not None and "project_id" in processed_values:
                    processed_values["project_id"] = temp_project_id
                elif temp_project_id is not None and "project_id" not in processed_values:
                    processed_values["project_id"] = temp_project_id
            
            # PostgreSQL 예약어 처리 (case 등)
            quoted_columns = []
            for col in processed_values.keys():
                if col.lower() in ['case', 'type', 'order']:
                    quoted_columns.append(f'"{col}"')
                else:
                    quoted_columns.append(col)
            
            # User 테이블의 경우 email 중복 체크 (INSERT 전에)
            if table_name == "user_user" and 'email' in processed_values:
                try:
                    target_cursor.execute(
                        "SELECT id FROM user_user WHERE email = %s",
                        (processed_values.get('email'),)
                    )
                    existing_user = target_cursor.fetchone()
                    if existing_user:
                        existing_id = existing_user['id']
                        id_mappings[table_name][source_id] = existing_id
                        inserted_count += 1
                        print(f"    ℹ️ ID {source_id} -> {existing_id} (email로 기존 User 매핑)")
                        continue  # 다음 레코드로
                except Exception as lookup_error:
                    # 조회 실패해도 INSERT 시도
                    pass
            
            # INSERT 쿼리 생성 (ID 제외, 새로 자동 생성)
            placeholders = ', '.join(['%s'] * len(processed_values))
            columns_str = ', '.join(quoted_columns)
            insert_query = f"""
                INSERT INTO {table_name} ({columns_str})
                VALUES ({placeholders})
                RETURNING id
            """
            
            try:
                target_cursor.execute(insert_query, list(processed_values.values()))
                result = target_cursor.fetchone()
                if result:
                    new_id = result['id']
                    # 소스 ID -> 새 ID 매핑 저장
                    id_mappings[table_name][source_id] = new_id
                    inserted_count += 1
            except Exception as e:
                error_msg = str(e)
                
                # 트랜잭션 롤백 (에러 발생 시)
                try:
                    target_conn.rollback()
                except:
                    pass
                
                # 에러 발생 시 즉시 예외를 다시 발생시켜 전체 롤백
                if 'foreign key' in error_msg.lower():
                    raise Exception(f"외래키 제약 위반 (ID {source_id}): {error_msg[:150]}")
                elif 'not-null constraint' in error_msg.lower() or 'null value' in error_msg.lower():
                    raise Exception(f"NOT NULL 제약 위반 (ID {source_id}): {error_msg[:150]}")
                elif 'unique constraint' in error_msg.lower() or 'duplicate key' in error_msg.lower():
                    raise Exception(f"Unique 제약 위반 (ID {source_id}): {error_msg[:150]}")
                else:
                    raise Exception(f"삽입 실패 (ID {source_id}): {error_msg[:150]}")

        except Exception as e:
            # 에러 발생 시 예외를 다시 발생시켜 전체 롤백
            raise

    print(f"    ✅ {inserted_count}개 레코드 삽입 완료")
    return inserted_count


def main():
    dry_run = '--dry-run' in sys.argv or '-d' in sys.argv
    
    print(f"Factory ID {FACTORY_ID} 마이그레이션 시작...")
    if dry_run:
        print("⚠️ DRY RUN 모드 - 실제 마이그레이션은 진행되지 않습니다.")

    try:
        # DB 연결
        source_conn = psycopg2.connect(SOURCE_DB_URL)
        source_conn.autocommit = True
        source_cursor = source_conn.cursor(cursor_factory=RealDictCursor)

        target_conn = psycopg2.connect(TARGET_DB_URL)
        target_conn.autocommit = False
        target_cursor = target_conn.cursor(cursor_factory=RealDictCursor)

        # Phase 0: User 마이그레이션 (필요한 User만)
        print("\n=== Phase 0: User 마이그레이션 ===")
        # Factory owner와 FactoryMember의 user_id 찾기
        source_cursor.execute(f"""
            SELECT DISTINCT owner_id as user_id FROM factory_factory WHERE id = {FACTORY_ID}
            UNION
            SELECT DISTINCT user_id FROM factory_factorymember WHERE factory_id = {FACTORY_ID} AND user_id IS NOT NULL
            UNION
            SELECT DISTINCT invited_by_id as user_id FROM factory_factorymember WHERE factory_id = {FACTORY_ID} AND invited_by_id IS NOT NULL
        """)
        user_ids = [row['user_id'] for row in source_cursor.fetchall()]
        
        if user_ids:
            user_ids_str = ','.join(map(str, user_ids))
            # User 마이그레이션 (새 ID 부여, User 테이블에는 직접 ForeignKey 없음)
            migrate_table(
                source_cursor, target_cursor,
                "user_user",
                f"id IN ({user_ids_str})",
                dry_run,
                fk_mappings={},  # User 테이블에는 ForeignKey가 없지만 매핑 로직은 적용됨
            )
            if not dry_run:
                target_conn.commit()
        
        # Phase 1: 핵심 엔티티
        print("\n=== Phase 1: 핵심 엔티티 ===")
        migrate_table(
            source_cursor, target_cursor,
            "factory_factory",
            f"id = {FACTORY_ID}",
            dry_run,
            fk_mappings={"owner_id": "user_user"},
        )
        if not dry_run:
            target_conn.commit()
        
        mapped_factory_id = get_mapped_id("factory_factory", FACTORY_ID) or FACTORY_ID
        
        migrate_table(
            source_cursor, target_cursor,
            "factory_factorymember",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={
                "factory_id": "factory_factory",
                "user_id": "user_user",
                "invited_by_id": "user_user",
            },
        )
        if not dry_run:
            target_conn.commit()
        
        migrate_table(
            source_cursor, target_cursor,
            "factory_factoryequipment",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={"factory_id": "factory_factory"},
        )
        if not dry_run:
            target_conn.commit()
        
        migrate_table(
            source_cursor, target_cursor,
            "factory_factoryclient",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={"factory_id": "factory_factory"},
        )
        if not dry_run:
            target_conn.commit()

        # Phase 2: 재고 관련
        print("\n=== Phase 2: 재고 관련 ===")
        migrate_table(
            source_cursor, target_cursor,
            "stock_material",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={"factory_id": "factory_factory"},
        )
        
        migrate_table(
            source_cursor, target_cursor,
            "stock_product",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={"factory_id": "factory_factory"},
        )
        
        # MaterialHistory
        source_cursor.execute(f"SELECT id FROM stock_material WHERE factory_id = {FACTORY_ID}")
        material_ids = [row['id'] for row in source_cursor.fetchall()]
        if material_ids:
            material_ids_str = ','.join(map(str, material_ids))
            migrate_table(
                source_cursor, target_cursor,
                "stock_materialhistory",
                f"material_id IN ({material_ids_str})",
                dry_run,
                fk_mappings={
                    "material_id": "stock_material",
                    "client_id": "factory_factoryclient",
                    "cash_receipt_id": "tax_cashreceipt",
                    "purchase_tax_invoice_id": "tax_nationaltaxservice",
                },
            )
        
        # ProductHistory
        source_cursor.execute(f"SELECT id FROM stock_product WHERE factory_id = {FACTORY_ID}")
        product_ids = [row['id'] for row in source_cursor.fetchall()]
        if product_ids:
            product_ids_str = ','.join(map(str, product_ids))
            migrate_table(
                source_cursor, target_cursor,
                "stock_producthistory",
                f"product_id IN ({product_ids_str})",
                dry_run,
                fk_mappings={"product_id": "stock_product"},
            )
        
        # MaterialProduct
        if material_ids and product_ids:
            conditions = []
            if material_ids:
                material_ids_str = ','.join(map(str, material_ids))
                conditions.append(f"material_id IN ({material_ids_str})")
            if product_ids:
                product_ids_str = ','.join(map(str, product_ids))
                conditions.append(f"product_id IN ({product_ids_str})")
            where_clause = " OR ".join(conditions)
            migrate_table(
                source_cursor, target_cursor,
                "stock_materialproduct",
                where_clause,
                dry_run,
                fk_mappings={
                    "material_id": "stock_material",
                    "product_id": "stock_product",
                },
            )
        
        # MaterialRepackaging
        if material_ids:
            source_cursor.execute(
                f"""
                SELECT mh.id 
                FROM stock_materialhistory mh
                JOIN stock_material m ON mh.material_id = m.id
                WHERE m.factory_id = {FACTORY_ID}
                """
            )
            history_ids = [row['id'] for row in source_cursor.fetchall()]
            if history_ids:
                history_ids_str = ','.join(map(str, history_ids))
                migrate_table(
                    source_cursor, target_cursor,
                    "repackaging_materialrepackaging",
                    f"parent_history_id IN ({history_ids_str})",
                    dry_run,
                    fk_mappings={"parent_history_id": "stock_materialhistory"},
                )

        # Phase 3: 문서 관련
        print("\n=== Phase 3: 문서 관련 ===")
        # Quotation은 project_id를 참조하지만, Project는 Quotation을 참조하므로
        # Quotation 마이그레이션 시 project_id는 임시 Project 레코드로 설정 (나중에 Project 마이그레이션 후 업데이트)
        # 원본 project_id를 저장하기 위해 소스에서 project_id를 먼저 조회
        source_cursor.execute(f"SELECT id, project_id FROM document_quotation WHERE factory_id = {FACTORY_ID}")
        quotation_project_mappings = {row['id']: row['project_id'] for row in source_cursor.fetchall()}
        
        # 임시 Project 레코드 생성 (Quotation 마이그레이션 전에 생성하여 project_id로 사용)
        temp_project_id = None
        if not dry_run:
            # 임시 Project 레코드 생성 (status는 기본값 'quotation' 사용, is_refunded는 False)
            target_cursor.execute("""
                INSERT INTO project_project (status, is_refunded, created_at, updated_at)
                VALUES ('quotation', FALSE, NOW(), NOW())
                RETURNING id
            """)
            temp_project_result = target_cursor.fetchone()
            if temp_project_result:
                temp_project_id = temp_project_result['id']
                print(f"  ℹ️ 임시 Project 레코드 생성 (ID: {temp_project_id})")
                target_conn.commit()
        
        # Quotation 마이그레이션 (임시 Project ID 사용)
        migrate_table(
            source_cursor, target_cursor,
            "document_quotation",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={
                "factory_id": "factory_factory",
                "client_id": "factory_factoryclient",
                # project_id는 임시 Project ID로 설정됨
            },
            temp_project_id=temp_project_id,  # 임시 Project ID 전달
        )
        
        if not dry_run:
            target_conn.commit()
        
        # QuotationProduct
        source_cursor.execute(f"SELECT id FROM document_quotation WHERE factory_id = {FACTORY_ID}")
        quotation_ids = [row['id'] for row in source_cursor.fetchall()]
        if quotation_ids or product_ids:
            conditions = []
            if quotation_ids:
                quotation_ids_str = ','.join(map(str, quotation_ids))
                conditions.append(f"quotation_id IN ({quotation_ids_str})")
            if product_ids:
                product_ids_str = ','.join(map(str, product_ids))
                conditions.append(f"product_id IN ({product_ids_str})")
            where_clause = " OR ".join(conditions) if conditions else "1=0"
            migrate_table(
                source_cursor, target_cursor,
                "document_quotationproduct",
                where_clause,
                dry_run,
                fk_mappings={
                    "quotation_id": "document_quotation",
                    "product_id": "stock_product",
                },
            )
        
        migrate_table(
            source_cursor, target_cursor,
            "document_workinstruction",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={"factory_id": "factory_factory"},
        )
        
        # WorkInstructionHistory
        source_cursor.execute(f"SELECT id FROM document_workinstruction WHERE factory_id = {FACTORY_ID}")
        work_instruction_ids = [row['id'] for row in source_cursor.fetchall()]
        if work_instruction_ids:
            work_instruction_ids_str = ','.join(map(str, work_instruction_ids))
            migrate_table(
                source_cursor, target_cursor,
                "document_workinstructionhistory",
                f"work_instruction_id IN ({work_instruction_ids_str})",
                dry_run,
                fk_mappings={
                    "work_instruction_id": "document_workinstruction",
                    "plan_id": "project_projectplan",
                    "changed_by_id": "user_user",
                },
            )

        # Phase 4: 프로젝트 관련
        print("\n=== Phase 4: 프로젝트 관련 ===")
        project_ids = []
        plan_ids = []
        
        if quotation_ids:
            # Project는 Quotation의 project_id를 역으로 사용하여 필터링
            # 소스 DB에서 Quotation의 project_id를 가져와서 Project를 찾음
            source_cursor.execute(f"SELECT DISTINCT project_id FROM document_quotation WHERE id IN ({','.join(map(str, quotation_ids))}) AND project_id IS NOT NULL")
            source_project_ids = [row['project_id'] for row in source_cursor.fetchall()]
            
            if source_project_ids:
                source_project_ids_str = ','.join(map(str, source_project_ids))
                migrate_table(
                    source_cursor, target_cursor,
                    "project_project",
                    f"id IN ({source_project_ids_str})",
                    dry_run,
                    fk_mappings={
                        "tax_invoice_id": "tax_nationaltaxservice",
                    },
                )
                if not dry_run:
                    target_conn.commit()
                
                # 마이그레이션된 Project ID 매핑
                for source_proj_id in source_project_ids:
                    # 타겟 DB에서 같은 ID를 가진 Project를 찾음 (새 ID가 부여되었으므로 매핑 필요)
                    # 하지만 Project는 새 ID가 부여되므로, 다른 방법으로 매핑해야 함
                    # Quotation의 project_id를 통해 간접적으로 매핑
                    pass
                
                # 소스 DB에서 Project ID와 Quotation ID 매핑 가져오기
                source_cursor.execute(f"""
                    SELECT DISTINCT q.project_id, q.id as quotation_id
                    FROM document_quotation q
                    WHERE q.id IN ({','.join(map(str, quotation_ids))}) AND q.project_id IS NOT NULL
                """)
                project_quotation_mappings = {}
                for row in source_cursor.fetchall():
                    proj_id = row['project_id']
                    quot_id = row['quotation_id']
                    if proj_id not in project_quotation_mappings:
                        project_quotation_mappings[proj_id] = []
                    project_quotation_mappings[proj_id].append(quot_id)
                
                # 타겟 DB에서 Project ID 매핑 (Quotation의 project_id를 통해)
                for source_proj_id, source_quotation_ids in project_quotation_mappings.items():
                    # 첫 번째 Quotation의 매핑된 ID를 사용하여 타겟 Project 찾기
                    if source_quotation_ids:
                        mapped_quotation_id = get_mapped_id("document_quotation", source_quotation_ids[0])
                        if mapped_quotation_id:
                            target_cursor.execute("SELECT project_id FROM document_quotation WHERE id = %s", (mapped_quotation_id,))
                            target_quotation = target_cursor.fetchone()
                            if target_quotation:
                                target_proj_id = target_quotation['project_id']
                                id_mappings["project_project"][source_proj_id] = target_proj_id
                                project_ids.append(target_proj_id)
            
            # Quotation의 project_id 업데이트 (Project 마이그레이션 후)
            if not dry_run:
                # quotation_project_mappings를 사용하여 원본 project_id 매핑
                updated_count = 0
                for source_quotation_id, source_project_id in quotation_project_mappings.items():
                    if source_project_id is not None:
                        mapped_quotation_id = get_mapped_id("document_quotation", source_quotation_id)
                        mapped_proj_id = get_mapped_id("project_project", source_project_id)
                        if mapped_quotation_id and mapped_proj_id:
                            target_cursor.execute(
                                "UPDATE document_quotation SET project_id = %s WHERE id = %s",
                                (mapped_proj_id, mapped_quotation_id)
                            )
                            updated_count += 1
                
                # 임시 Project 레코드 삭제 (더 이상 사용되지 않는 경우)
                if temp_project_id:
                    # 임시 Project가 다른 Quotation에서 사용되지 않는지 확인
                    target_cursor.execute("SELECT COUNT(*) as count FROM document_quotation WHERE project_id = %s", (temp_project_id,))
                    usage_result = target_cursor.fetchone()
                    usage_count = usage_result['count'] if usage_result else 0
                    if usage_count == 0:
                        target_cursor.execute("DELETE FROM project_project WHERE id = %s", (temp_project_id,))
                        print(f"  ℹ️ 임시 Project 레코드 삭제 (ID: {temp_project_id})")
                
                target_conn.commit()
                print(f"  ✅ Quotation의 project_id 업데이트 완료 ({updated_count}개 레코드)")
        
        source_cursor.execute(f"SELECT id FROM factory_factoryequipment WHERE factory_id = {FACTORY_ID}")
        equipment_ids = [row['id'] for row in source_cursor.fetchall()]
        
        source_cursor.execute(f"SELECT id FROM document_quotationproduct WHERE quotation_id IN ({','.join(map(str, quotation_ids))})")
        quotation_product_ids = [row['id'] for row in source_cursor.fetchall()]
        
        if project_ids or equipment_ids or quotation_product_ids:
            conditions = []
            if project_ids:
                project_ids_str = ','.join(map(str, project_ids))
                conditions.append(f"project_id IN ({project_ids_str})")
            if equipment_ids:
                equipment_ids_str = ','.join(map(str, equipment_ids))
                conditions.append(f"equipment_id IN ({equipment_ids_str})")
            if quotation_product_ids:
                quotation_product_ids_str = ','.join(map(str, quotation_product_ids))
                conditions.append(f"product_id IN ({quotation_product_ids_str})")
            where_clause = " OR ".join(conditions) if conditions else "1=0"
            migrate_table(
                source_cursor, target_cursor,
                "project_projectplan",
                where_clause,
                dry_run,
                fk_mappings={
                    "project_id": "project_project",
                    "equipment_id": "factory_factoryequipment",
                    "product_id": "document_quotationproduct",
                },
            )
            if not dry_run:
                target_conn.commit()
        
        # ProjectLog: project_id로 필터링
        if project_ids:
            project_ids_str = ','.join(map(str, project_ids))
            migrate_table(
                source_cursor, target_cursor,
                "project_projectlog",
                f"project_id IN ({project_ids_str})",
                dry_run,
                fk_mappings={
                    "project_id": "project_project",
                    "refund_id": "project_refund",
                },
            )
            if not dry_run:
                target_conn.commit()
        
        # Refund: product_id 또는 plan_id로 필터링
        if project_ids:
            source_cursor.execute(f"SELECT id FROM project_projectplan WHERE project_id IN ({','.join(map(str, project_ids))})")
            plan_ids = [row['id'] for row in source_cursor.fetchall()]
        
        if product_ids or plan_ids:
            conditions = []
            if product_ids:
                product_ids_str = ','.join(map(str, product_ids))
                conditions.append(f"product_id IN ({product_ids_str})")
            if plan_ids:
                plan_ids_str = ','.join(map(str, plan_ids))
                conditions.append(f"plan_id IN ({plan_ids_str})")
            where_clause = " OR ".join(conditions) if conditions else "1=0"
            migrate_table(
                source_cursor, target_cursor,
                "project_refund",
                where_clause,
                dry_run,
                fk_mappings={
                    "product_id": "stock_product",
                    "plan_id": "project_projectplan",
                },
            )
            if not dry_run:
                target_conn.commit()
        
        # MaterialUsage: plan_id 또는 material_id로 필터링
        if plan_ids or material_ids:
            conditions = []
            if plan_ids:
                plan_ids_str = ','.join(map(str, plan_ids))
                conditions.append(f"plan_id IN ({plan_ids_str})")
            if material_ids:
                material_ids_str = ','.join(map(str, material_ids))
                conditions.append(f"original_material_id IN ({material_ids_str})")
                conditions.append(f"material_id IN ({material_ids_str})")
            where_clause = " OR ".join(conditions) if conditions else "1=0"
            migrate_table(
                source_cursor, target_cursor,
                "stock_materialusage",
                where_clause,
                dry_run,
                fk_mappings={
                    "plan_id": "project_projectplan",
                    "original_material_id": "stock_material",
                    "material_id": "stock_material",
                    "material_history_id": "stock_materialhistory",
                    "material_repackaging_id": "repackaging_materialrepackaging",
                },
            )
            if not dry_run:
                target_conn.commit()
        
        # Phase 5: 세금 관련
        print("\n=== Phase 5: 세금 관련 ===")
        migrate_table(
            source_cursor, target_cursor,
            "tax_nationaltaxservice",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={
                "factory_id": "factory_factory",
                "user_id": "user_user",
                "client_id": "factory_factoryclient",
            },
        )
        
        migrate_table(
            source_cursor, target_cursor,
            "tax_cashreceipt",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={
                "factory_id": "factory_factory",
                "user_id": "user_user",
                "client_id": "factory_factoryclient",
            },
        )

        # Phase 6: 구독 관련
        print("\n=== Phase 6: 구독 관련 ===")
        migrate_table(
            source_cursor, target_cursor,
            "subscription_subscriptionhistory",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={
                "factory_id": "factory_factory",
                "subscription_id": "subscription_subscription",
            },
        )
        if not dry_run:
            target_conn.commit()
        
        # Payment
        source_cursor.execute(f"SELECT id FROM subscription_subscriptionhistory WHERE factory_id = {FACTORY_ID}")
        subscription_history_ids = [row['id'] for row in source_cursor.fetchall()]
        if subscription_history_ids:
            subscription_history_ids_str = ','.join(map(str, subscription_history_ids))
            migrate_table(
                source_cursor, target_cursor,
                "subscription_payment",
                f"subscription_history_id IN ({subscription_history_ids_str})",
                dry_run,
                fk_mappings={"subscription_history_id": "subscription_subscriptionhistory"},
            )
            if not dry_run:
                target_conn.commit()
        
        migrate_table(
            source_cursor, target_cursor,
            "subscription_paymentauth",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={"factory_id": "factory_factory"},
        )
        if not dry_run:
            target_conn.commit()

        # Phase 7: 기타
        print("\n=== Phase 7: 기타 ===")
        source_cursor.execute(f"SELECT id FROM factory_factorymember WHERE factory_id = {FACTORY_ID}")
        member_ids = [row['id'] for row in source_cursor.fetchall()]
        if member_ids:
            member_ids_str = ','.join(map(str, member_ids))
            migrate_table(
                source_cursor, target_cursor,
                "notification_notification",
                f"receiver_id IN ({member_ids_str})",
                dry_run,
                fk_mappings={"receiver_id": "factory_factorymember"},
            )
        
        # Location: factory_id=19와 관련된 Material/Product가 사용하는 Location만 마이그레이션
        # Location 테이블에 member_id가 없을 수 있으므로, Material/Product와의 ManyToMany 관계를 통해 Location ID 찾기
        try:
            source_cursor.execute(f"""
                SELECT DISTINCT sml.location_id
                FROM stock_material_location sml
                JOIN stock_material m ON sml.material_id = m.id
                WHERE m.factory_id = {FACTORY_ID}
                UNION
                SELECT DISTINCT spl.location_id
                FROM stock_product_location spl
                JOIN stock_product p ON spl.product_id = p.id
                WHERE p.factory_id = {FACTORY_ID}
            """)
            location_ids = [row['location_id'] for row in source_cursor.fetchall()]
            if location_ids:
                location_ids_str = ','.join(map(str, location_ids))
                migrate_table(
                    source_cursor, target_cursor,
                    "location_location",
                    f"id IN ({location_ids_str})",
                    dry_run,
                    # member_id가 없을 수 있으므로 fk_mappings는 비워둠
                )
        except Exception as e:
            if "does not exist" in str(e) or "relation" in str(e).lower():
                print(f"  location_location: 관련 Location 데이터 없음 또는 테이블 구조 다름 (건너뜀)")
            else:
                raise
        
        migrate_table(
            source_cursor, target_cursor,
            "unit_conversion_unitconversion",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={
                "factory_id": "factory_factory",
                "material_id": "stock_material",
                "product_id": "stock_product",
            },
        )
        
        migrate_table(
            source_cursor, target_cursor,
            "substitute_substitute",
            f"factory_id = {FACTORY_ID}",
            dry_run,
            fk_mappings={
                "factory_id": "factory_factory",
                "source_material_id": "stock_material",
            },
        )

        if not dry_run:
            target_conn.commit()

        # Phase 8: ManyToMany 관계
        print("\n=== Phase 8: ManyToMany 관계 ===")
        
        # 1. Material-Location ManyToMany
        source_cursor.execute(f"SELECT id FROM stock_material WHERE factory_id = {FACTORY_ID}")
        material_ids = [row['id'] for row in source_cursor.fetchall()]
        if material_ids:
            material_ids_str = ','.join(map(str, material_ids))
            try:
                source_cursor.execute(f"""
                    SELECT material_id, location_id 
                    FROM stock_material_location 
                    WHERE material_id IN ({material_ids_str})
                """)
                material_location_rows = source_cursor.fetchall()
                if material_location_rows:
                    print(f"  stock_material_location: {len(material_location_rows)}개 관계 발견")
                    if not dry_run:
                        inserted_count = 0
                        skipped_count = 0
                        for row in material_location_rows:
                            source_material_id = row['material_id']
                            source_location_id = row['location_id']
                            mapped_material_id = get_mapped_id("stock_material", source_material_id)
                            mapped_location_id = get_mapped_id("location_location", source_location_id)
                            if mapped_material_id and mapped_location_id:
                                # Location이 실제로 타겟 DB에 존재하는지 확인
                                try:
                                    target_cursor.execute("SELECT id FROM location_location WHERE id = %s", (mapped_location_id,))
                                    location_exists = target_cursor.fetchone()
                                    if not location_exists:
                                        skipped_count += 1
                                        continue
                                except Exception:
                                    # Location 테이블이 없으면 건너뜀
                                    skipped_count += 1
                                    continue
                                
                                try:
                                    target_cursor.execute("""
                                        INSERT INTO stock_material_location (material_id, location_id)
                                        VALUES (%s, %s)
                                        ON CONFLICT DO NOTHING
                                    """, (mapped_material_id, mapped_location_id))
                                    if target_cursor.rowcount > 0:
                                        inserted_count += 1
                                except Exception as e:
                                    # 관계가 이미 존재할 수 있음
                                    skipped_count += 1
                            else:
                                skipped_count += 1
                        if inserted_count > 0:
                            target_conn.commit()
                            print(f"    ✅ {inserted_count}개 관계 삽입 완료")
                        else:
                            print(f"    ℹ️ 마이그레이션할 관계 없음 (Location 테이블 없음 또는 이미 존재)")
                else:
                    print(f"  stock_material_location: 마이그레이션할 데이터 없음")
            except Exception as e:
                if "does not exist" in str(e) or "relation" in str(e).lower():
                    print(f"  stock_material_location: 테이블이 존재하지 않음 (건너뜀)")
                else:
                    raise
        
        # 2. Product-Location ManyToMany
        source_cursor.execute(f"SELECT id FROM stock_product WHERE factory_id = {FACTORY_ID}")
        product_ids = [row['id'] for row in source_cursor.fetchall()]
        if product_ids:
            product_ids_str = ','.join(map(str, product_ids))
            try:
                source_cursor.execute(f"""
                    SELECT product_id, location_id 
                    FROM stock_product_location 
                    WHERE product_id IN ({product_ids_str})
                """)
                product_location_rows = source_cursor.fetchall()
                if product_location_rows:
                    print(f"  stock_product_location: {len(product_location_rows)}개 관계 발견")
                    if not dry_run:
                        inserted_count = 0
                        skipped_count = 0
                        for row in product_location_rows:
                            source_product_id = row['product_id']
                            source_location_id = row['location_id']
                            mapped_product_id = get_mapped_id("stock_product", source_product_id)
                            mapped_location_id = get_mapped_id("location_location", source_location_id)
                            if mapped_product_id and mapped_location_id:
                                # Location이 실제로 타겟 DB에 존재하는지 확인
                                try:
                                    target_cursor.execute("SELECT id FROM location_location WHERE id = %s", (mapped_location_id,))
                                    location_exists = target_cursor.fetchone()
                                    if not location_exists:
                                        skipped_count += 1
                                        continue
                                except Exception:
                                    # Location 테이블이 없으면 건너뜀
                                    skipped_count += 1
                                    continue
                                
                                try:
                                    target_cursor.execute("""
                                        INSERT INTO stock_product_location (product_id, location_id)
                                        VALUES (%s, %s)
                                        ON CONFLICT DO NOTHING
                                    """, (mapped_product_id, mapped_location_id))
                                    if target_cursor.rowcount > 0:
                                        inserted_count += 1
                                except Exception as e:
                                    # 관계가 이미 존재할 수 있음
                                    skipped_count += 1
                            else:
                                skipped_count += 1
                        if inserted_count > 0:
                            target_conn.commit()
                            print(f"    ✅ {inserted_count}개 관계 삽입 완료")
                        if skipped_count > 0:
                            print(f"    ℹ️ {skipped_count}개 관계 건너뜀 (Location 테이블 없음 또는 매핑 불가)")
                        if inserted_count == 0 and skipped_count == 0:
                            print(f"    ℹ️ 마이그레이션할 관계 없음")
                else:
                    print(f"  stock_product_location: 마이그레이션할 데이터 없음")
            except Exception as e:
                if "does not exist" in str(e) or "relation" in str(e).lower():
                    print(f"  stock_product_location: 테이블이 존재하지 않음 (건너뜀)")
                else:
                    raise
        
        # 3. Substitute-TargetMaterials ManyToMany
        substitute_ids = []
        try:
            source_cursor.execute(f"SELECT id FROM substitute_substitute WHERE factory_id = {FACTORY_ID}")
            substitute_ids = [row['id'] for row in source_cursor.fetchall()]
        except Exception as e:
            if "does not exist" in str(e) or "relation" in str(e).lower():
                print(f"  substitute_substitute_target_materials: Substitute 테이블이 존재하지 않음 (건너뜀)")
            else:
                raise
        
        if substitute_ids:
            substitute_ids_str = ','.join(map(str, substitute_ids))
            try:
                source_cursor.execute(f"""
                    SELECT substitute_id, material_id 
                    FROM substitute_substitute_target_materials 
                    WHERE substitute_id IN ({substitute_ids_str})
                """)
                substitute_material_rows = source_cursor.fetchall()
                if substitute_material_rows:
                    print(f"  substitute_substitute_target_materials: {len(substitute_material_rows)}개 관계 발견")
                    if not dry_run:
                        inserted_count = 0
                        skipped_count = 0
                        for row in substitute_material_rows:
                            source_substitute_id = row['substitute_id']
                            source_material_id = row['material_id']
                            mapped_substitute_id = get_mapped_id("substitute_substitute", source_substitute_id)
                            mapped_material_id = get_mapped_id("stock_material", source_material_id)
                            if mapped_substitute_id and mapped_material_id:
                                try:
                                    target_cursor.execute("""
                                        INSERT INTO substitute_substitute_target_materials (substitute_id, material_id)
                                        VALUES (%s, %s)
                                        ON CONFLICT DO NOTHING
                                    """, (mapped_substitute_id, mapped_material_id))
                                    if target_cursor.rowcount > 0:
                                        inserted_count += 1
                                except Exception as e:
                                    # Substitute 테이블이 없거나 관계가 이미 존재할 수 있음
                                    skipped_count += 1
                            else:
                                skipped_count += 1
                        if inserted_count > 0:
                            target_conn.commit()
                            print(f"    ✅ {inserted_count}개 관계 삽입 완료")
                        if skipped_count > 0:
                            print(f"    ℹ️ {skipped_count}개 관계 건너뜀 (Substitute 테이블 없음 또는 매핑 불가)")
                        if inserted_count == 0 and skipped_count == 0:
                            print(f"    ℹ️ 마이그레이션할 관계 없음")
                else:
                    print(f"  substitute_substitute_target_materials: 마이그레이션할 데이터 없음")
            except Exception as e:
                if "does not exist" in str(e) or "relation" in str(e).lower():
                    print(f"  substitute_substitute_target_materials: 테이블이 존재하지 않음 (건너뜀)")
                else:
                    raise
        
        # 4. WorkInstruction-Plans ManyToMany
        source_cursor.execute(f"SELECT id FROM document_workinstruction WHERE factory_id = {FACTORY_ID}")
        work_instruction_ids = [row['id'] for row in source_cursor.fetchall()]
        if work_instruction_ids:
            work_instruction_ids_str = ','.join(map(str, work_instruction_ids))
            try:
                source_cursor.execute(f"""
                    SELECT workinstruction_id, projectplan_id 
                    FROM document_workinstruction_plans 
                    WHERE workinstruction_id IN ({work_instruction_ids_str})
                """)
                workinstruction_plan_rows = source_cursor.fetchall()
                if workinstruction_plan_rows:
                    print(f"  document_workinstruction_plans: {len(workinstruction_plan_rows)}개 관계 발견")
                    if not dry_run:
                        inserted_count = 0
                        skipped_count = 0
                        for row in workinstruction_plan_rows:
                            source_workinstruction_id = row['workinstruction_id']
                            source_plan_id = row['projectplan_id']
                            mapped_workinstruction_id = get_mapped_id("document_workinstruction", source_workinstruction_id)
                            mapped_plan_id = get_mapped_id("project_projectplan", source_plan_id)
                            if mapped_workinstruction_id and mapped_plan_id:
                                try:
                                    target_cursor.execute("""
                                        INSERT INTO document_workinstruction_plans (workinstruction_id, projectplan_id)
                                        VALUES (%s, %s)
                                        ON CONFLICT DO NOTHING
                                    """, (mapped_workinstruction_id, mapped_plan_id))
                                    if target_cursor.rowcount > 0:
                                        inserted_count += 1
                                except Exception as e:
                                    # 관계가 이미 존재할 수 있음
                                    skipped_count += 1
                            else:
                                skipped_count += 1
                        if inserted_count > 0:
                            target_conn.commit()
                            print(f"    ✅ {inserted_count}개 관계 삽입 완료")
                        if skipped_count > 0:
                            print(f"    ℹ️ {skipped_count}개 관계 건너뜀 (매핑 불가 또는 이미 존재)")
                        if inserted_count == 0 and skipped_count == 0:
                            print(f"    ℹ️ 마이그레이션할 관계 없음")
                else:
                    print(f"  document_workinstruction_plans: 마이그레이션할 데이터 없음")
            except Exception as e:
                if "does not exist" in str(e) or "relation" in str(e).lower():
                    print(f"  document_workinstruction_plans: 테이블이 존재하지 않음 (건너뜀)")
                else:
                    raise

        if not dry_run:
            target_conn.commit()
            print("\n✅ 모든 마이그레이션이 완료되었습니다!")
        else:
            target_conn.rollback()
            print("\n⚠️ DRY RUN 모드 - 실제 마이그레이션은 진행되지 않았습니다.")

    except Exception as e:
        if not dry_run:
            target_conn.rollback()
        print(f"\n❌ 마이그레이션 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        source_conn.close()
        target_conn.close()


if __name__ == "__main__":
    main()
