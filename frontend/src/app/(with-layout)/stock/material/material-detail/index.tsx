import MiniBtn from "@/ui/mini-btn";
import MaterialInfo from "./material-info";
import ProductRequiringMaterial from "./product-requiring-material";
import QuotationHistory from "./quotation-history.tsx";
import { useState } from "react";

interface MaterialDetailProps {
  setIsCustomerInfoModalOpen: (isOpen: boolean) => void;
  setIsProductEnrollmentModalOpen: (isOpen: boolean) => void;
}

const MaterialDetail = ({
  setIsCustomerInfoModalOpen,
  setIsProductEnrollmentModalOpen,
}: MaterialDetailProps) => {
  useState(false);
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 text-dg h-10 flex items-center">
          원자재 정보
        </h3>
        <MaterialInfo />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 text-dg h-10 flex items-center">
          업체별 견적 내용
        </h3>
        <QuotationHistory
          setIsCustomerInfoModalOpen={setIsCustomerInfoModalOpen}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="h-10 flex items-center justify-between">
          <h3 className="Heading-3 text-dg">이 원자재가 투입되는 품목</h3>
          <MiniBtn
            text="추가하기"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={() => setIsProductEnrollmentModalOpen(true)}
          />
        </div>
        <ProductRequiringMaterial />
      </div>

      {/* <div className="flex flex-col gap-3">
        <h3 className="Heading-3 text-dg h-10 flex items-center">
          원자재 재고 이력
        </h3>
        <MaterialStockLog />
      </div> */}
    </div>
  );
};

export default MaterialDetail;
