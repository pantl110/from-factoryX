import { TaxDocumentType, TransactionType } from '@/types/status-type';
import InfoLabelValue from '@/ui/info-label-value';
import { TaxClientInfoModel } from '@/types/data-model';
import { formatISODate } from '@/utils';

interface TaxBuyerProviderInfoProps {
  taxType: TaxDocumentType;
  clientInfo: TaxClientInfoModel;
  updatedAt: string;
  transactionType: TransactionType;
}

const TaxBuyerProviderInfo = ({
  taxType,
  clientInfo,
  updatedAt,
  transactionType,
}: TaxBuyerProviderInfoProps) => {
  // clientInfo가 null인 경우 처리
  if (!clientInfo) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 h-10 items-center flex">
          {taxType === 'sales' ? '거래처 정보' : '구매처 정보'}
        </h3>
        <div className="width-full border-b border-lg">
          <InfoLabelValue label="업체명" value="-" />
          <InfoLabelValue label="사업자등록번호" value="-" />
          <InfoLabelValue label="대표자명" value="-" />
          <div className="flex">
            <InfoLabelValue label="업태" value="-" />
            <InfoLabelValue label="종목" value="-" />
          </div>
          <InfoLabelValue label="사업장 주소" value="-" />
          <InfoLabelValue label="작성일자" value={formatISODate(updatedAt)} />
          <div className="flex">
            <InfoLabelValue label="문서 상태" chip={{ status: taxType }} />
            <InfoLabelValue
              label="구분"
              value={transactionType === 'receipt' ? '영수' : '청구'}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">
        {taxType === 'sales' ? '거래처 정보' : '구매처 정보'}
      </h3>
      <div className="width-full border-b border-lg">
        <InfoLabelValue label="업체명" value={clientInfo.name || '-'} />
        <InfoLabelValue
          label="사업자등록번호"
          value={clientInfo.business_registration_number || '-'}
        />
        <InfoLabelValue
          label="대표자명"
          value={clientInfo.representative_name || '-'}
        />
        <div className="flex">
          <InfoLabelValue
            label="업태"
            value={clientInfo.business_type || '-'}
          />
          <InfoLabelValue
            label="종목"
            value={clientInfo.business_category || '-'}
          />
        </div>
        <InfoLabelValue label="사업장 주소" value={clientInfo.address || '-'} />
        <InfoLabelValue label="작성일자" value={formatISODate(updatedAt)} />
        <div className="flex">
          <InfoLabelValue label="문서 상태" chip={{ status: taxType }} />
          <InfoLabelValue
            label="구분"
            value={transactionType === 'receipt' ? '영수' : '청구'}
          />
        </div>
      </div>
    </div>
  );
};

export default TaxBuyerProviderInfo;
