import {
  MaterialHistoryResponseModel,
  MaterialRepackagingResponseModel,
  MaterialResponseModel,
} from '@/types/data-model';
import { ExpiryStatusType } from '@/types/status-type';

export const mapMaterialToFormData = (mat: MaterialResponseModel) => ({
  materialName: mat.name ?? '',
  materialCode: mat.code ?? '',
  size: mat.spec ?? '',
  unit: mat.unit ?? '',
  currentStock:
    mat.current_stock !== undefined && mat.current_stock !== null
      ? mat.current_stock.toString()
      : '',
  standardStock:
    mat.standard_stock !== undefined && mat.standard_stock !== null
      ? mat.standard_stock.toString()
      : '',
  rop: mat.rop !== undefined && mat.rop !== null ? mat.rop.toString() : '',
  maxStock:
    mat.max_stock !== undefined && mat.max_stock !== null
      ? mat.max_stock.toString()
      : '',
  expiryDays:
    mat.expiry_days !== undefined && mat.expiry_days !== null
      ? mat.expiry_days.toString()
      : '',
  memo: mat.memo ?? '',
});

export const mapExpiryStatus = (
  status?: string | null
): ExpiryStatusType | null => {
  switch (status) {
    case '위험':
      return 'warning';
    case '양호':
      return 'safe';
    default:
      return null;
  }
};

const DEFAULT_EXPIRY_WARNING_DAYS = 0;

type ExpiryTargetType =
  | MaterialRepackagingResponseModel
  | MaterialHistoryResponseModel
  | {
      expiration_date: string | null;
      quantity?: number | null;
      remaining_quantity?: number | null;
    };

interface ExpiryClassNameParamsModel {
  target: ExpiryTargetType;
  warningDays?: number | null;
}

export const getExpiryClassName = ({
  target,
  warningDays,
}: ExpiryClassNameParamsModel) => {
  const expirationDate = target.expiration_date;

  if (!expirationDate) {
    return 'text-dg';
  }

  // MaterialHistoryResponseModel은 remaining_quantity를 사용
  // MaterialRepackagingResponseModel은 quantity를 사용
  // remaining_quantity가 있으면 우선 사용 (입고 내역), 없으면 quantity 사용 (소분 내역)
  // API 응답에서 문자열로 올 수 있으므로 숫자로 변환
  const remainingQuantityRaw =
    'remaining_quantity' in target ? target.remaining_quantity : undefined;
  const quantityRaw = 'quantity' in target ? target.quantity : undefined;

  // 문자열 또는 숫자를 숫자로 변환
  const parseToNumber = (value: unknown): number | null => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const remainingQuantity = parseToNumber(remainingQuantityRaw);
  const quantity = parseToNumber(quantityRaw);

  // remaining_quantity가 있으면 우선 사용 (입고 내역), 없으면 quantity 사용 (소분 내역)
  const availableQuantity =
    remainingQuantity !== null
      ? remainingQuantity
      : quantity !== null
        ? quantity
        : null;

  // 수량이 0이거나 없으면 회색 (유통기한 체크 없이)
  if (availableQuantity === null || availableQuantity <= 0) {
    return 'text-dg';
  }

  const expiryDate = new Date(expirationDate);
  if (Number.isNaN(expiryDate.getTime())) {
    console.error('Invalid expiry date:', expirationDate);
    return 'text-dg';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  const diffMs = expiryDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const warningPeriodDays =
    typeof warningDays === 'number' ? warningDays : DEFAULT_EXPIRY_WARNING_DAYS;

  // 유통기한이 이미 지났거나 (diffDays < 0), 위험 기간 이내면 빨간색
  return diffDays < 0 || diffDays <= warningPeriodDays ? 'text-red' : 'text-dg';
};
