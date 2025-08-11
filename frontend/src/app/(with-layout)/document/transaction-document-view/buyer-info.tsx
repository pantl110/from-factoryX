import InfoLabelValue from '@/ui/info-label-value';
import { QuotationResponseModel } from '@/types/data-model';

interface BuyerInfoProps {
  quotationData: QuotationResponseModel;
}

const BuyerInfo = ({ quotationData }: BuyerInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">구매처 정보</h3>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <InfoLabelValue label="회사명" value={quotationData.factory_name} />
          <InfoLabelValue
            label="사업자등록번호"
            value={quotationData.business_registration_number}
          />
        </div>
        <InfoLabelValue
          label="대표자명"
          value={quotationData.representative_name}
        />
        <div className="flex">
          <InfoLabelValue label="업태" value={quotationData.business_type} />
          <InfoLabelValue
            label="종목"
            value={quotationData.business_category}
          />
        </div>
        <InfoLabelValue label="사업장 주소" value={quotationData.address} />
        <div className="flex">
          <InfoLabelValue label="이메일" value={quotationData.email} />
          <InfoLabelValue label="연락처" value={quotationData.phone} />
        </div>
        <InfoLabelValue label="팩스 번호" value={quotationData.fax} />
      </div>
    </div>
  );
};

export default BuyerInfo;
