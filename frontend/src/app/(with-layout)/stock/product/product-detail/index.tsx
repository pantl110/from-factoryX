import { CaretLineRightIcon } from "@phosphor-icons/react/dist/ssr";
import ProductInfo from "./product-info";
import MiniBtn from "@/ui/mini-btn";
import ProductComment from "./product-comment";
import StockStatus from "./stock-status";
import ProductStockLog from "./product-stock-log";

const ProductDetail = () => {
  return (
    <div className="bg-white px-10 py-5 flex flex-col gap-5">
      <div className="flex gap-2 items-center border-b border-[#eeeeee] pb-3">
        <button className="flex items-center justify-center w-10 h-10">
          <CaretLineRightIcon size={20} />
        </button>
        <h3 className="Heading-3 text-dg">품목 재고관리</h3>
      </div>

      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            품목 정보
          </h3>
          <ProductInfo />
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-10 flex items-center justify-between">
            <h3 className="Heading-3 text-dg ">품목 특이사항 히스토리</h3>
            <MiniBtn
              text="작성하기"
              textColor="text-dg"
              borderColor="border-[#eeeeee]"
            />
          </div>
          <ProductComment />
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-10 flex items-center justify-between">
            <h3 className="Heading-3 text-dg ">원자재 재고 상태</h3>
            <MiniBtn
              text="연결하기"
              textColor="text-dg"
              borderColor="border-[#eeeeee]"
            />
          </div>
          <StockStatus />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            품목 재고 이력
          </h3>
          <ProductStockLog />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
