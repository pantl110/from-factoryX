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

  const remainingQuantity =
    'remaining_quantity' in target ? target.remaining_quantity : undefined;
  const quantity = 'quantity' in target ? target.quantity : undefined;

  const availableQuantity =
    typeof remainingQuantity === 'number'
      ? remainingQuantity
      : typeof quantity === 'number'
        ? quantity
        : 0;

  if (availableQuantity <= 0) {
    return 'text-dg';
  }

  const expiryDate = new Date(expirationDate);
  if (Number.isNaN(expiryDate.getTime())) {
    return 'text-dg';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = expiryDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const warningPeriodDays =
    typeof warningDays === 'number' ? warningDays : DEFAULT_EXPIRY_WARNING_DAYS;

  return diffDays <= warningPeriodDays ? 'text-red' : 'text-dg';
};
