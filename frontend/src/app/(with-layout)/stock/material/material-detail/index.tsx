import MiniBtn from "@/ui/mini-btn";
import { CaretLineRightIcon } from "@phosphor-icons/react/dist/ssr";
import CustomerInfo from "./customer-info";
import MaterialInfo from "./material-info";
import MaterialStockLog from "./material-stock-log";
import ProductRequiringMaterial from "./product-requiring-material";

const MaterialDetail = () => {
  return (
    <div className="bg-white px-10 py-5 flex flex-col gap-5">
      <div className="flex gap-2 items-center border-b border-[#eeeeee] pb-3">
        <button className="flex items-center justify-center w-10 h-10">
          <CaretLineRightIcon size={20} />
        </button>
        <h3 className="Heading-3 text-dg">원자재 재고관리</h3>
      </div>

      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            거래처 정보
          </h3>
          <CustomerInfo />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            원자재 정보
          </h3>
          <MaterialInfo />
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-10 flex items-center justify-between">
            <h3 className="Heading-3 text-dg">이 원자재가 투입되는 품목</h3>
            <MiniBtn
              text="추가하기"
              textColor="text-dg"
              borderColor="border-[#eeeeee]"
            />
          </div>
          <ProductRequiringMaterial />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            원자재 재고 이력
          </h3>
          <MaterialStockLog />
        </div>
      </div>
    </div>
  );
};

export default MaterialDetail;
