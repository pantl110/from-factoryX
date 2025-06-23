"use client";

import { useState } from "react";
import ProductInfo from "./product-info";
import MiniBtn from "@/ui/mini-btn";
import StockStatus from "./stock-status";
import ProductStockLog from "./product-stock-log";
import Panel from "@/ui/panel";
import { ProductDataModel } from "@/mocks/product-data";
import NoHistoryBox from "../no-history-box";
import ConnectMaterialModal from "../modals/connect-material-modal";

// '생성' 모드일 때 사용할 비어있는 품목 객체의 초기값
const EMPTY_PRODUCT: ProductDataModel = {
  id: 0,
  productName: "",
  productCode: "",
  size: "",
  unit: "",
  stock: -1,
  productionTime: "",
  location: "",
  comment: [],
};

interface ProductDetailProps {
  product: ProductDataModel | null;
  onClose: () => void;
  mode: "create" | "view";
}

const ProductDetail = ({ product, onClose, mode }: ProductDetailProps) => {
  const isCreateMode = mode === "create";

  // 생성모드: 빈 객체, 보기모드: 전달받은 product
  const [formData, setFormData] = useState<ProductDataModel>(
    product || EMPTY_PRODUCT,
  );
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  return (
    <Panel title="품목 재고관리" onClose={onClose}>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            품목 정보
          </h3>
          <ProductInfo
            product={formData}
            isEditable={isCreateMode} // 생성모드일 때만 수정 가능
            onClick={() => setFormData(EMPTY_PRODUCT)} // lint오류 해결 위한 임시
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-10 flex items-center justify-between">
            <h3 className="Heading-3 text-dg ">원자재 재고 상태</h3>
            <MiniBtn
              text="연결하기"
              textColor="text-dg"
              borderColor="border-[#eeeeee]"
              onClick={() => setIsMaterialModalOpen(true)}
            />
          </div>
          {isCreateMode ? (
            <NoHistoryBox
              title="이 품목에 연결된 원자재가 아직 없어요."
              text="원자재를 연결하면 이곳에 재고 상태가 표시됩니다."
            />
          ) : (
            <StockStatus />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            품목 재고 이력
          </h3>
          {isCreateMode ? (
            <NoHistoryBox
              title="이 품목의 재고 이력이 아직 없어요."
              text="입고, 출고 재고 관련 이력이 등록되면 이곳에 표시됩니다."
            />
          ) : (
            <ProductStockLog />
          )}
        </div>
      </div>
      {isMaterialModalOpen && (
        <ConnectMaterialModal onClose={() => setIsMaterialModalOpen(false)} />
      )}
    </Panel>
  );
};

export default ProductDetail;
