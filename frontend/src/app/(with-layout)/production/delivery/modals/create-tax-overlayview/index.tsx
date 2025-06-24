import DocumentViewTitle from "@/app/(with-layout)/document/document-view-title";
import OrderItemInfo from "@/app/(with-layout)/document/tax-document-view/order-item-info";
import MiniBtn from "@/ui/mini-btn";
import OverlayView from "@/ui/ovelay-view";
import ProviderInfo from "./provider-info";
import BuyerInfo from "./buyer-info";

interface CreateTaxOverlayviewProps {
  onClose: () => void;
}

const CreateTaxOverlayview = ({ onClose }: CreateTaxOverlayviewProps) => {
  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 p-8">
        <div className="pb-6 w-full flex justify-between border-b border-lg">
          <div>
            <h2 className="Heading-2">세금계산서를 발행하시겠어요?</h2>
            <div className="mt-2.5 Me_Body-3 text-gr">
              발행 전, 세금계산서 내용을 한 번 더 확인해 주세요.
            </div>
          </div>
          <div className="flex gap-2.5">
            <MiniBtn text="취소하기" textColor="text-sv" onClick={onClose} />{" "}
            <MiniBtn
              text="이메일 보내기"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="bg-primary-hover"
            />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <DocumentViewTitle
            title="[플라스틱이 좋아]건 세금계산서"
            dateLabel="작성일자"
            date="2025-07-31"
          />
          <div className="flex gap-5">
            <ProviderInfo />
            <BuyerInfo />
          </div>
          <OrderItemInfo />
        </div>
      </div>
    </OverlayView>
  );
};

export default CreateTaxOverlayview;
