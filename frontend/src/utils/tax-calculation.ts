import { TaxType } from '@/types/status-type';

export interface TaxLineAmountsModel {
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export const calculateTaxLineAmounts = (
  quantity: number,
  unitPrice: number,
  taxType?: TaxType
): TaxLineAmountsModel => {
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const safeUnitPrice =
    Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;
  const supplyAmount = Math.floor(safeQuantity * safeUnitPrice);
  const taxAmount = taxType === 'taxable' ? Math.floor(supplyAmount * 0.1) : 0;

  return {
    supplyAmount,
    taxAmount,
    totalAmount: supplyAmount + taxAmount,
  };
};
