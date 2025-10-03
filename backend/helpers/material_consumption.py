"""
원자재 소모 처리 관련 유틸리티 함수들
"""

from typing import List, Tuple
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from websocket.utils import send_notification_to_factory


async def process_material_consumption(
    product_id: int, production_quantity: int, factory_id: int = None
) -> Tuple[bool, str]:
    """
    제품 생산 시 원자재 소모를 처리합니다. material history도 생성합니다.

    Args:
        product_id: 제품 ID
        production_quantity: 생산 수량
        factory_id: 공장 ID (선택사항, 특정 공장의 재고만 확인할 때 사용)

    Returns:
        Tuple[bool, str]: (성공 여부, 메시지 또는 에러 메시지)

    Raises:
        HttpError: 원자재 재고 부족 또는 처리 실패 시
    """
    try:
        from stock.models import MaterialProduct, MaterialHistory

        print(
            f"🔍 process_material_consumption 시작: product_id={product_id}, quantity={production_quantity}, factory_id={factory_id}"
        )

        # 제품과 연결된 원자재들 조회 (material도 함께 로드)
        material_products = await sync_to_async(list)(
            MaterialProduct.objects.filter(product_id=product_id).select_related(
                "material"
            )
        )
        print(f"🔍 찾은 MaterialProduct 수: {len(material_products)}")

        if not material_products:
            print(f"🔍 원자재 소모 정보 없음")
            return True, "원자재 소모 정보가 없습니다."

        consumed_materials = []

        for material_product in material_products:
            # 소모량 계산 = 생산 수량 * 단위 소모량
            consumption_quantity = production_quantity * float(
                material_product.quantity
            )

            # 원자재 재고 확인 및 감소 (이미 select_related로 로드됨)
            material = material_product.material

            # 공장별 재고 확인 (factory_id가 제공된 경우)
            if factory_id and hasattr(material.__class__, "factory"):
                # factory 필드를 동기적으로 확인
                material_factory_id = await sync_to_async(
                    lambda: getattr(material, "factory_id", None)
                )()
                if material_factory_id and material_factory_id != factory_id:
                    continue  # 다른 공장의 원자재는 건너뛰기

            current_stock_value = int(material.current_stock or 0)
            standard_stock_value = int(material.standard_stock or 0)

            # MaterialHistory 생성 (소모). save()가 material.current_stock를 total_stock로 반영
            # 실제 재고 반영 값은 현재 재고에서 직접 차감
            new_total = int(current_stock_value - consumption_quantity)
            await sync_to_async(MaterialHistory.objects.create)(
                material=material,
                type="consumption",
                client=None,
                quantity=int(consumption_quantity),
                total_stock=new_total,
            )

            # 부족 알림
            # 최신 current_stock는 save 내에서 업데이트되므로 new_total로 비교 가능
            if new_total < standard_stock_value:
                await send_notification_to_factory(
                    factory_id=int(factory_id),
                    notification_type="warning",
                    notification_case="material_lack",
                    content=f"{material.name} 원자재 부족",
                    additional_data={"material_id": material.id},
                )

            consumed_materials.append(
                {
                    "name": material.name,
                    "consumed": int(consumption_quantity),
                    "remaining": new_total,
                }
            )

        if consumed_materials:
            material_names = [m["name"] for m in consumed_materials]
            return True, f"원자재 소모 완료: {', '.join(material_names)}"
        else:
            return True, "소모된 원자재가 없습니다."

    except HttpError:
        # HttpError는 그대로 재발생
        raise
    except Exception as e:
        # 기타 예외는 500 에러로 변환
        print(f"Raw material consumption failed: {str(e)}")
        raise HttpError(500, f"원자재 소모 처리 중 오류가 발생했습니다: {str(e)}")


async def check_material_availability(
    product_id: int, production_quantity: int, factory_id: int = None
) -> Tuple[bool, List[dict], str]:
    """
    제품 생산 전 원자재 가용성을 확인합니다.

    Args:
        product_id: 제품 ID
        production_quantity: 생산 수량
        factory_id: 공장 ID (선택사항)

    Returns:
        Tuple[bool, List[dict], str]: (가용성 여부, 원자재 정보 리스트, 메시지)
    """
    try:
        from stock.models import MaterialProduct

        material_products = await sync_to_async(list)(
            MaterialProduct.objects.filter(product_id=product_id)
        )

        if not material_products:
            return True, [], "원자재 소모 정보가 없습니다."

        material_status = []
        all_available = True

        for material_product in material_products:
            consumption_quantity = production_quantity * float(
                material_product.quantity
            )

            material = material_product.material

            # 공장별 재고 확인
            if factory_id and hasattr(material.__class__, "factory"):
                material_factory_id = await sync_to_async(
                    lambda: getattr(material, "factory_id", None)
                )()
                if material_factory_id and material_factory_id != factory_id:
                    continue

            available = material.current_stock >= consumption_quantity
            if not available:
                all_available = False

            material_status.append(
                {
                    "name": material.name,
                    "required": consumption_quantity,
                    "available": material.current_stock,
                    "sufficient": available,
                }
            )

        if all_available:
            return True, material_status, "모든 원자재가 충분합니다."
        else:
            return False, material_status, "일부 원자재가 부족합니다."

    except Exception as e:
        print(f"Material availability check failed: {str(e)}")
        return False, [], f"원자재 가용성 확인 중 오류가 발생했습니다: {str(e)}"


async def reverse_material_consumption(
    product_id: int, production_quantity: int, factory_id: int = None
) -> Tuple[bool, str]:
    """
    제품 생산 취소 시 원자재 소모를 되돌립니다.

    Args:
        product_id: 제품 ID
        production_quantity: 되돌릴 생산 수량
        factory_id: 공장 ID (선택사항)

    Returns:
        Tuple[bool, str]: (성공 여부, 메시지)
    """
    try:
        from stock.models import MaterialProduct

        material_products = await sync_to_async(list)(
            MaterialProduct.objects.filter(product_id=product_id)
        )

        if not material_products:
            return True, "되돌릴 원자재 소모 정보가 없습니다."

        restored_materials = []

        for material_product in material_products:
            # 되돌릴 수량 계산 = 생산 수량 * 단위 소모량
            restore_quantity = production_quantity * float(material_product.quantity)

            material = material_product.material

            # 공장별 재고 확인
            if factory_id and hasattr(material.__class__, "factory"):
                material_factory_id = await sync_to_async(
                    lambda: getattr(material, "factory_id", None)
                )()
                if material_factory_id and material_factory_id != factory_id:
                    continue

            # 재고 증가
            material.current_stock += restore_quantity
            await sync_to_async(material.save)()

            restored_materials.append(
                {
                    "name": material.name,
                    "restored": restore_quantity,
                    "current": material.current_stock,
                }
            )

        if restored_materials:
            material_names = [m["name"] for m in restored_materials]
            return True, f"원자재 소모 되돌림 완료: {', '.join(material_names)}"
        else:
            return True, "되돌린 원자재가 없습니다."

    except Exception as e:
        print(f"Material consumption reversal failed: {str(e)}")
        raise HttpError(500, f"원자재 소모 되돌림 중 오류가 발생했습니다: {str(e)}")
