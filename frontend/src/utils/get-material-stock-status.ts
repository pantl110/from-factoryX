import { InventoryStatusType } from '@/types/status-type';

/**
 * 자재 재고 상태를 판단하는 함수
 * @param params - 자재 재고 관련 파라미터
 * @param params.currentStock - 현재 재고
 * @param params.maxStock - 최대 재고
 * @param params.rop - 재주문점 (Reorder Point)
 * @param params.standardStock - 안전 재고
 * @returns 자재 상태 ('과재고' | '충분' | '위험' | '부족') 또는 null (필수 값이 없을 경우)
 */
export function getMaterialStockStatus(params: {
  currentStock?: number | null;
  maxStock?: number | null;
  rop?: number | null;
  standardStock?: number | null;
}): InventoryStatusType | null {
  const { currentStock, maxStock, rop, standardStock } = params;

  // current_stock이 없으면 판단 불가
  if (currentStock === null || currentStock === undefined) {
    return null;
  }

  // 1. 과재고: 현재 재고 > 최대 재고
  if (maxStock !== null && maxStock !== undefined) {
    if (currentStock > maxStock) {
      return '과재고';
    }
  }

  // 2. 충분: 최대 재고 >= 현재 재고 > ROP
  if (
    maxStock !== null &&
    maxStock !== undefined &&
    rop !== null &&
    rop !== undefined
  ) {
    if (currentStock <= maxStock && currentStock > rop) {
      return '충분';
    }
  }

  // 3. 위험: ROP >= 현재 재고 > 안전 재고
  if (
    rop !== null &&
    rop !== undefined &&
    standardStock !== null &&
    standardStock !== undefined
  ) {
    if (currentStock <= rop && currentStock > standardStock) {
      return '위험';
    }
  }

  // 4. 부족: 현재 재고 <= 안전 재고 또는 현재 재고 === 0
  if (standardStock !== null && standardStock !== undefined) {
    if (currentStock <= standardStock) {
      return '부족';
    }
  }

  // 현재 재고가 0이면 부족
  if (currentStock === 0) {
    return '부족';
  }

  // 판단할 수 없는 경우
  return null;
}

