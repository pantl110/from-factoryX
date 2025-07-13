import InfoLabelValue from '@/ui/info-label-value'
import PriceInfo from '@/ui/price-info'
import QuotationTableHeader from './quotation-table-header'
import QuotationTableItem from './quotation-table-item'

const Quotation = () => {
  return (
    <div className="flex flex-col gap-6 px-10 pt-4 pb-9">
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 text-dg">수요자 정보</h3>
        <div className="w-full">
          <div className="flex">
            <InfoLabelValue label="회사명" value="플라스틱이 좋아" />
            <InfoLabelValue label="사업자등록번호" value="123-45-67890" />
          </div>
          <div className="flex">
            <InfoLabelValue label="대표자명" value="홍길동" />
            <InfoLabelValue label="납기일자" value="2025-06-10" />
          </div>
          <div className="flex">
            <InfoLabelValue label="업태" value="제조업" />
            <InfoLabelValue label="종목" value="플라스틱 사출" />
          </div>
          <div className="flex">
            <InfoLabelValue label="사업장 주소" value="경기도 남양주시" />
          </div>
          <div className="flex">
            <InfoLabelValue label="담당자 이메일" value="company@mail.com" />
            <InfoLabelValue label="담당자 연락처" value="010-1234-5678" />
          </div>
          <div className="flex">
            <InfoLabelValue label="담당자 팩스" value="02-123-4567" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 text-dg">견적 품목 정보</h3>
        <PriceInfo />
      </div>
      <div className="flex flex-col">
        <QuotationTableHeader />
        <QuotationTableItem />
        <QuotationTableItem />
        <QuotationTableItem />
        <QuotationTableItem />
        <QuotationTableItem />
        <QuotationTableItem />
        <QuotationTableItem />
        <QuotationTableItem />
      </div>
    </div>
  )
}

export default Quotation
