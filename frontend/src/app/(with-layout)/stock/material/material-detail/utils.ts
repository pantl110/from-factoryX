import { MaterialResponseModel } from '@/types/data-model';
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
  rop:
    mat.rop !== undefined && mat.rop !== null ? mat.rop.toString() : '',
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
