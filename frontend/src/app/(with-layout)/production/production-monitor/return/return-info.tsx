import InfoLabelValue from "@/ui/info-label-value";
import MiniBtn from "@/ui/mini-btn";
import { ReturnDataModel } from "@/mocks/return-data";

interface ReturnInfoProps {
  returnData: ReturnDataModel;
}

const ReturnInfo = ({ returnData }: ReturnInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <h3 className="Heading-3 text-dg flex items-center">
          반품 정보 {returnData.id}
        </h3>
        <div className="flex gap-2.5">
          <MiniBtn
            text="수정하기"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
          />
          <MiniBtn
            text="생산 등록하기"
            disabled={true}
            hoverColor="hover:bg-bg"
          />
        </div>
      </div>

      <div>
        <div className="border-t border-b border-[#eeeeee]">
          <InfoLabelValue label="반품품목" value={returnData.productName} />
        </div>
        <div className="border-b border-[#eeeeee]">
          <InfoLabelValue label="반품일자" value={returnData.returnDate} />
        </div>
        <div className="border-b border-[#eeeeee]">
          <InfoLabelValue label="반품수량" value={returnData.returnQuantity} />
        </div>
        <div className="border-b border-[#eeeeee]">
          <InfoLabelValue label="현재재고" value={returnData.currentStock} />
        </div>
        <div className="border-b border-[#eeeeee]">
          <InfoLabelValue
            label="생산수량"
            value={returnData.productionQuantity}
          />
        </div>
      </div>
    </div>
  );
};

export default ReturnInfo;
