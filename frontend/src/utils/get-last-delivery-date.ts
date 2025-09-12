import { ProjectQuotationModel } from '@/types/data-model';

const getLastDeliveryDate = (quotationData: ProjectQuotationModel): string => {
  if (
    !quotationData ||
    !quotationData.products ||
    quotationData.products.length === 0
  ) {
    return '-';
  }

  const dates = quotationData.products
    .map((p) => p.delivery_date)
    .filter((d): d is string => !!d && d.trim() !== '')
    .sort();

  return dates.length > 0 ? dates[dates.length - 1] : '-';
};

export default getLastDeliveryDate;
