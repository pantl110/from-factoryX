import { ProjectQuotationModel } from '@/types/data-model';

const getLastDeliveryDate = (
  quotationData: ProjectQuotationModel
): string => {
  if (!quotationData || !quotationData.products || quotationData.products.length === 0) {
    return '-';
  }

  const dates = quotationData.products
    .map((p) => p.delivery_date)
    .filter((d): d is string => !!d && d.trim() !== '')
    // YYYY-MM-DD 가정: 문자열 정렬로 최신일자 계산 가능
    .sort();

  return dates.length > 0 ? dates[dates.length - 1] : '-';
};

export default getLastDeliveryDate;