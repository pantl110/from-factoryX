import { LabelInfo } from '../label-info';
import InfoDetail from '../info-detail';

const QuotationProductInfo = () => {
  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">생산 제품 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label="총 생산제품" value="5EA" />
        <div className="flex flex-col gap-3">
          <InfoDetail label="플라스틱 1 (제품코드)" value="1 EA" />
          <InfoDetail label="플라스틱 2 (제품코드)" value="1 EA" />
          <InfoDetail label="플라스틱 3 (제품코드)" value="1 EA" />
          <InfoDetail label="플라스틱 4 (제품코드)" value="1 EA" />
        </div>
      </div>
    </div>
  );
};

export default QuotationProductInfo;
