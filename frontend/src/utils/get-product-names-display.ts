import { ProjectResponseModel } from "@/types/data-model";

/**
 * 품목명 배열을 표시용 문자열로 변환
 * @param productNames - 품목명 문자열 배열
 * @returns 표시용 문자열
 *
 * @example
 * getProductNamesDisplay(["자재A"]) // "자재A"
 * getProductNamesDisplay(["자재A", "자재B"]) // "자재A 외 1개"
 * getProductNamesDisplay(["자재A", "자재B", "자재C"]) // "자재A 외 2개"
 */
export const getProductNamesDisplay = (productNames: string[]): string => {
  if (!productNames || productNames.length === 0) {
    return '-';
  }

  if (productNames.length === 1) {
    return productNames[0];
  }

  return `${productNames[0]} 외 ${productNames.length - 1}개`;
};

export const getProductNames = (project: ProjectResponseModel) => {
  const productsName =
  project.status === 'quotation' ||
  project.status === 'confirmed' ||
  project.status === 'suspended'
    ? project.quotations[0].products.length > 1
      ? `${project.quotations[0].products[0].product.name} 외 ${project.quotations[0].products.length - 1}개`
      : project.quotations[0].products[0]?.product?.name || '-'
    : project.quotations &&
        project.quotations.length > 0 &&
        project.quotations[0].products_info &&
        project.quotations[0].products_info.length > 1
      ? `${project.quotations[0].products_info[0].name} 외 ${project.quotations[0].products_info.length - 1}개`
      : project.quotations[0].products_info[0]?.name || '-';

      return productsName;
};