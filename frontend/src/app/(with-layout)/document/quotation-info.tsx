import ProductItem from "../quotation/product-item";
import PriceInfo from "@/ui/price-info";
import dummyProducts from "@/mocks/quotation-products";

interface QuotationInfoProps {
  title: string;
}

const QuotationInfo = ({ title }: QuotationInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">{title}</h3>
      <PriceInfo />
      <div>
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="px-3 flex-1">품목명</p>
          <p className="px-3 flex-1">품목 코드</p>
          <p className="px-3 flex-1">규격</p>
          <p className="px-3 w-[80px]">단위</p>
          <p className="px-3 flex-1">제작수량</p>
          <p className="px-3 w-[100px]">단가</p>
          <p className="px-3 flex-1">금액</p>
        </div>
        {dummyProducts.map((item, index) => (
          <ProductItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

export default QuotationInfo;
