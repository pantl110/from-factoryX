import DocumentViewTitle from "@/app/(with-layout)/document/document-view-title";
import InfoLabelValue from "@/ui/info-label-value";
import MiniBtn from "@/ui/mini-btn";
import OverlayView from "@/ui/ovelay-view";
import { DeliveryDataModel } from "../../types";

interface DeliveryOverlayProps {
  onClose: () => void;
  data: DeliveryDataModel;
}

const DeliveryOverlay = ({ onClose, data }: DeliveryOverlayProps) => {
  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 p-8">
        <div className="pb-6 w-full flex justify-between border-b border-lg">
          <div>
            <h2 className="Heading-2">납품표를 출력하시겠어요?</h2>
            <div className="mt-2.5 Me_Body-3 text-gr">
              출력 전, 납품서 내용을 한 번 더 확인해 주세요.
            </div>
          </div>
          <div className="flex gap-2.5">
            <MiniBtn
              text="취소하기"
              textColor="text-sv"
              hoverColor=""
              onClick={onClose}
            />
            <MiniBtn
              text="발행하기"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
            />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <DocumentViewTitle title="납품표" />
          <div className="flex flex-col">
            <InfoLabelValue label="납품처" value={data.companyName} />
            <InfoLabelValue label="품목명" value={data.productName} />
            <InfoLabelValue label="규격" value={data.size} />
            <InfoLabelValue label="수량" value={data.quantity} />
          </div>
        </div>
      </div>
    </OverlayView>
  );
};

export default DeliveryOverlay;
