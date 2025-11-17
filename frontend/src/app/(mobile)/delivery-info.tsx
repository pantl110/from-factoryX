import InfoDetail from './info-detail';
import { LabelInfo } from './label-info';
import { ProjectQuotationProductsModel } from '@/types/data-model';

interface DeliveryInfoProps {
  isOrderPage?: boolean;
  address?: string | null;
  products?: ProjectQuotationProductsModel[];
  dueDate?: string | null;
}

const getProductField = (
  product: ProjectQuotationProductsModel,
  key: 'name' | 'code' | 'unit'
) => product.product?.[key] ?? product.product_info?.[key] ?? null;

const formatProductLabel = (product: ProjectQuotationProductsModel) => {
  const name = getProductField(product, 'name');
  const code = getProductField(product, 'code');
  if (!name && !code) return '-';
  if (name && code) return `${name} (${code})`;
  return name || code || '-';
};

const formatProductValue = (product: ProjectQuotationProductsModel) => {
  const unit = getProductField(product, 'unit');
  const quantity = product.quantity ?? null;
  if (quantity === undefined || quantity === null) {
    return unit || '-';
  }
  return unit ? `${quantity} ${unit}` : `${quantity}`;
};

const DeliveryInfo = ({
  isOrderPage = false,
  address,
  products,
  dueDate,
}: DeliveryInfoProps) => {
  const productsInfo =
    products && products.length > 0
      ? products.map((product) => ({
          label: formatProductLabel(product),
          value: formatProductValue(product),
        }))
      : [];

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">납품 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label="사업장 주소" value={address || '-'} direction="col" />
        <div className="h-[1px] bg-bg" />

        {isOrderPage || (
          <>
            <div className="flex flex-col gap-2">
              <LabelInfo label="납품할 제품 정보" />
              <div className="flex flex-col gap-2">
                {productsInfo.length > 0 ? (
                  productsInfo.map((product, index) => (
                    <InfoDetail
                      key={index}
                      label={product.label}
                      value={product.value}
                    />
                  ))
                ) : (
                  <></>
                )}
              </div>
            </div>
            <div className="h-[1px] bg-bg" />
          </>
        )}

        <LabelInfo label="납기일" value={dueDate || '-'} />
      </div>

      {isOrderPage || (
        <div className="flex gap-3 items-center px-2 py-3 bg-bg rounded-[8px]">
          <div className="w-1.5 h-1.5 bg-lg rounded-full" />
          <h3 className="m-Body-4 text-primary">
            거래명세서와 납품표는 PC에서 확인하실 수 있습니다
          </h3>
        </div>
      )}
    </div>
  );
};

export default DeliveryInfo;
