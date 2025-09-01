import ProductItem from '../quotation/product-item';
import PriceInfo from '@/ui/price-info';
import { QuotationProductDetailResponseModel } from '@/types/data-model';

interface ProductListInfoProps {
  productListInfoTitle: string;
  productItems: QuotationProductDetailResponseModel[];
  supplyAmount: number;
}

const ProductListInfo = ({
  productListInfoTitle,
  supplyAmount,
  productItems,
}: ProductListInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">
        {productListInfoTitle}
      </h3>

      <table>
        <thead>
          <tr className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
            <th className="text-left px-3 flex-1">품목명</th>
            <th className="text-left px-3 flex-1">품목코드</th>
            <th className="text-left px-3 flex-1">규격</th>
            <th className="text-left px-3 w-[80px]">단위</th>
            <th className="text-left px-3 flex-1">제작 수량</th>
            <th className="text-left px-3 w-[100px]">단가</th>
            <th className="text-left px-3 flex-1">금액</th>
          </tr>
        </thead>
        <tbody>
          {productItems.map((item, index) => (
            <ProductItem key={index} data={item} onlyRead={true} />
          ))}
        </tbody>
      </table>

      <PriceInfo supplyAmount={supplyAmount} />
    </div>
  );
};

export default ProductListInfo;
