import { TaxDocumentType } from "@/types/status-type";
import InfoLabelValue from "@/ui/info-label-value";

interface TaxBuyerProviderInfoProps {
  taxType: TaxDocumentType;
}

const TaxBuyerProviderInfo = ({ taxType }: TaxBuyerProviderInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">
        {taxType === "매출" ? "판매처 정보" : "구매처 정보"}
      </h3>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <InfoLabelValue label="거래처명" value="플라스틱이 좋아" />
          <InfoLabelValue label="사업자등록번호" value="123-45-67890" />
        </div>

        <div className="flex">
          <InfoLabelValue label="대표자명" value="홍길동" />
          <InfoLabelValue label="담당자 이메일" value="company@mail.com" />
        </div>
        <div className="flex">
          <InfoLabelValue label="담당자 연락처" value="010-9876-5432" />
          <InfoLabelValue label="팩스번호" value="02-987-6543" />
        </div>
        <div className="flex">
          <InfoLabelValue label="업태" value="제조업" />
          <InfoLabelValue label="종목" value="플라스틱 사출" />
        </div>
        <InfoLabelValue label="사업장 주소" value="경기도 남양주시" />
        <div className="flex">
          <InfoLabelValue label="거래일자" value="2025-06-11" />
          <InfoLabelValue label="문서 상태" chip={{ status: taxType }} />
        </div>
      </div>
    </div>
  );
};

export default TaxBuyerProviderInfo;
