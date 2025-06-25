import MiniBtn from "@/ui/mini-btn";
import ProductItem from "./product-item";
import dummyProducts from "@/mocks/quotation-products";
import { ProductProps } from "./types";

interface RequestInfoProps {
  onProductClick: (product: ProductProps) => void;
}

const RequestInfo = ({ onProductClick }: RequestInfoProps) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">요청정보</h3>
        <MiniBtn
          text="품목 추가하기"
          textColor="text-dg"
          borderColor="border-lg"
          iconColor="text-sv"
          hoverColor="hover:bg-bg"
        />
      </div>

      <div className="w-full overflow-x-auto">
        <div className="w-[938px]">
          <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
            <p className=" py-1 px-3 flex-1">품목명</p>
            <p className=" py-1 px-3 flex-1">품목 코드</p>
            <p className=" py-1 px-3 flex-1">규격</p>
            <p className=" py-1 px-3 w-[80px]">단위</p>
            <p className=" py-1 px-3 flex-1">제작수량</p>
            <p className=" py-1 px-3 w-[100px]">단가</p>
            <p className=" py-1 px-3 flex-1">금액</p>
          </div>
          {dummyProducts.map((item, index) => (
            <ProductItem
              key={index}
              {...item}
              onClick={() => onProductClick(item)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default RequestInfo;
