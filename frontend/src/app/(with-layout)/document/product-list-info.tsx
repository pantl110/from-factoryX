import ProductItem from "../quotation/product-item";
import PriceInfo from "@/ui/price-info";
import dummyProducts from "@/mocks/quotation-products";

interface ProductListInfoProps {
  transaction?: boolean;
}

const ProductListInfo = ({ transaction = false }: ProductListInfoProps) => {
  const title = transaction ? "거래 품목 정보" : "주문 품목 정보";
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">{title}</h3>
      <PriceInfo />
      <table>
        <thead>
          <tr className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
            <th className="text-left px-3 flex-1">품목명</th>
            <th className="text-left px-3 flex-1">품목 코드</th>
            <th className="text-left px-3 flex-1">규격</th>
            <th className="text-left px-3 w-[80px]">단위</th>
            <th className="text-left px-3 flex-1">제작 수량</th>
            <th className="text-left px-3 w-[100px]">단가</th>
            <th className="text-left px-3 flex-1">금액</th>
            {!transaction && <th className="text-left px-3 w-8"></th>}
          </tr>
        </thead>
        <tbody>
          {dummyProducts.map((item, index) => (
            <ProductItem key={index} {...item} transaction={transaction} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductListInfo;
