import InfoLabelValue from '@/ui/info-label-value';
import { TaxFactoryInfoModel } from '@/types/data-model';

interface SellerInfoProps {
  lastDeliveryDate: string;
  factoryData: TaxFactoryInfoModel;
}

const SellerInfo = ({ lastDeliveryDate, factoryData }: SellerInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">판매처 정보</h3>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <InfoLabelValue label="회사명" value={factoryData?.name || '-'} />
          <InfoLabelValue
            label="사업자등록번호"
            value={factoryData?.business_registration_number || '-'}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="대표자명"
            value={factoryData?.representative_name || '-'}
          />
          <InfoLabelValue label="거래일자" value={lastDeliveryDate} />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="업태"
            value={factoryData?.business_type || '-'}
          />
          <InfoLabelValue
            label="종목"
            value={factoryData?.business_category || '-'}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="이메일"
            value={factoryData?.manager_email || '-'}
          />
          <InfoLabelValue
            label="연락처"
            value={factoryData?.manager_phone || '-'}
          />
        </div>
        <InfoLabelValue
          label="팩스 번호"
          value={factoryData?.manager_fax || '-'}
        />
        <InfoLabelValue
          label="사업장 주소"
          value={factoryData?.business_address || '-'}
        />
      </div>
    </div>
  );
};

export default SellerInfo;
