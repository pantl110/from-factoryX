import { TaxDocumentType } from '@/types/status-type'
import InfoLabelValue from '@/ui/info-label-value'

interface TaxBuyerProviderInfoProps {
  taxType: TaxDocumentType
}

const TaxBuyerProviderInfo = ({ taxType }: TaxBuyerProviderInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">
        {taxType === '매출' ? '거래처 정보' : '구매처 정보'}
      </h3>
      <div className="width-full border-b border-lg">
        <InfoLabelValue label="업체명" value="플라스틱이 좋아" />
        <InfoLabelValue label="사업자등록번호" value="123-45-67890" />

        <InfoLabelValue label="대표자명" value="홍길동" />
        <div className="flex">
          <InfoLabelValue label="업태" value="제조업" />
          <InfoLabelValue label="종목" value="플라스틱 사출" />
        </div>
        <InfoLabelValue label="사업장 주소" value="경기도 남양주시" />
        <InfoLabelValue label="작성일자" value="2025-07-02" />
        <div className="flex">
          <InfoLabelValue label="문서 상태" chip={{ status: taxType }} />
          <InfoLabelValue label="구분" value="청구" />
        </div>
      </div>
    </div>
  )
}

export default TaxBuyerProviderInfo
