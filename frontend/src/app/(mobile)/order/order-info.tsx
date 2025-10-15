import InfoDetail from '../info-detail';
import { LabelInfo } from '../label-info';

const OrderInfo = () => {
  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">주문 제품 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label="총 생산제품" value="5EA" />
        <div className="flex flex-col gap-3">
          <InfoDetail label="플라스틱 1 (제품코드)" value="1 EA" />
          <InfoDetail label="플라스틱 2 (제품코드)" value="1 EA" />
          <InfoDetail label="플라스틱 3 (제품코드)" value="1 EA" />
          <InfoDetail label="플라스틱 4 (제품코드)" value="1 EA" />
          <InfoDetail label="플라스틱 5 (제품코드)" value="1 EA" />
        </div>
      </div>
      <div className="h-[1px] bg-bg" />

      <div className="flex flex-col gap-5">
        <div className="flex justify-between">
          <h4 className="m-Heading-4b">총 합계금액</h4>
          <span className="m-Heading-3-semibold text-primary">50,000원</span>
        </div>
        <div className="flex flex-col gap-3">
          <InfoDetail label="공급가액" value="45,455원" />
          <InfoDetail label="세액" value="4,545원" />
        </div>
      </div>
      <div className="h-[1px] bg-bg" />

      {/* info */}
      <div className="flex flex-col gap-2 px-2 py-3 bg-bg rounded-[8px]">
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 bg-lg rounded-full" />
          <h3 className="m-Body-4 text-primary">
            제품에 대한 자세한 정보는 PC에서 확인하실 수 있습니다.
          </h3>
        </div>
      </div>
    </div>
  );
};

export default OrderInfo;
