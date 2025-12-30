import InfoDetail from '../info-detail';
import { ProjectQuotationProductsModel } from '@/types/data-model';

interface OrderInfoProps {
  products?: ProjectQuotationProductsModel[] | null;
}

const OrderInfo = ({ products }: OrderInfoProps) => {
  const productsData = Array.isArray(products) ? products : [];

  const totalAmount = productsData.reduce((acc, product) => {
    return acc + product.quantity * product.unit_price;
  }, 0);
  const totalTaxAmount = totalAmount * 0.1;
  const totalSupplyAmount = totalAmount - totalTaxAmount;

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">주문 제품 정보</h3>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          {productsData.map((product, index) => (
            <InfoDetail
              key={index}
              label={`${product.product.name} (${product.product.code})`}
              value={`${product.quantity} ${product.product.unit}`}
            />
          ))}
        </div>
      </div>
      <div className="h-[1px] bg-bg" />

      <div className="flex flex-col gap-5">
        <div className="flex justify-between">
          <h4 className="m-Heading-4b">총 합계금액</h4>
          <span className="m-Heading-3-semibold text-primary">
            {totalAmount.toLocaleString()}원
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <InfoDetail
            label="공급가액"
            value={`${totalSupplyAmount.toLocaleString()}원`}
          />
          <InfoDetail
            label="세액"
            value={`${totalTaxAmount.toLocaleString()}원`}
          />
        </div>
      </div>
      <div className="h-[1px] bg-bg" />

      {/* info */}
      <div className="flex flex-col gap-2 px-2 py-3 bg-bg rounded-[8px]">
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 bg-lg rounded-full" />
          <h3 className="m-Body-4 text-primary">
            제품에 대한 자세한 정보는 PC에서 확인하실 수 있습니다.
          </h3>
        </div>
      </div>
    </div>
  );
};

export default OrderInfo;
