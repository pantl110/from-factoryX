import ProductInfo from "./product-info";
import MiniBtn from "@/ui/mini-btn";
import ProductComment from "./product-comment";
import StockStatus from "./stock-status";
import ProductStockLog from "./product-stock-log";
import Panel from "@/ui/panel";
import { ProductDataModel } from "@/mocks/product-data";

interface ProductDetailProps {
  product: ProductDataModel;
  onClose: () => void;
}

const ProductDetail = ({ product, onClose }: ProductDetailProps) => {
  return (
    <Panel title="품목 상세" onClose={onClose}>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            품목 정보
          </h3>
          <ProductInfo product={product} />
        </div>

        {/* <div className="flex flex-col gap-3">
          <div className="h-10 flex items-center justify-between">
            <h3 className="Heading-3 text-dg ">품목 특이사항 히스토리</h3>
            <MiniBtn
              text="작성하기"
              textColor="text-dg"
              borderColor="border-[#eeeeee]"
            />
          </div>
          <ProductComment />
        </div> */}

        <div className="flex flex-col gap-3">
          <div className="h-10 flex items-center justify-between">
            <h3 className="Heading-3 text-dg ">원자재 재고 상태</h3>
            <MiniBtn
              text="연결하기"
              textColor="text-dg"
              borderColor="border-[#eeeeee]"
              onClick={() => {}}
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
    </Panel>
  );
};

export default ProductDetail;
