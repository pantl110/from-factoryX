import { ProjectQuotationModel, ProjectStatusResponseModel } from '@/types/data-model';

export const getLastDeliveryDate = (
  projectStatusData: ProjectStatusResponseModel | null
): string => {
  if (
    !projectStatusData ||
    !projectStatusData.quotations ||
    projectStatusData.quotations.length === 0
  )
    return '-';

  const firstQuotation: ProjectQuotationModel = projectStatusData.quotations[0];
  const products = firstQuotation?.products as
    | Array<{ delivery_date?: string | null }>
    | undefined;

  if (!products || products.length === 0) return '-';

  const dates = products
    .map((p) => p?.delivery_date)
    .filter((d): d is string => typeof d === 'string' && d.length > 0);

  if (dates.length === 0) return '-';

  const latest = dates.reduce((acc, cur) => (acc > cur ? acc : cur));
  return latest;
};

export default getLastDeliveryDate;
