import InfoLabelValue from "@/ui/info-label-value";

const SellerInfo = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">판매처 정보</h3>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <InfoLabelValue label="회사명" value="플라스틱이 좋아" />
          <InfoLabelValue label="사업자등록번호" value="123-45-67890" />
        </div>
        <div className="flex">
          <InfoLabelValue label="대표자명" value="홍길동" />
          <InfoLabelValue label="거래일자" value="2025-07-31" />
        </div>
        <div className="flex">
          <InfoLabelValue label="이메일" value="company@mail.com" />
          <InfoLabelValue label="연락처" value="010-9876-5432" />
        </div>
        <div className="flex">
          <InfoLabelValue label="업태" value="제조업" />
          <InfoLabelValue label="종목" value="플라스틱 사출" />
        </div>
        <InfoLabelValue label="팩스 번호" value="02-987-6543" />
        <InfoLabelValue label="사업장 주소" value="경기도 남양주시" />
      </div>
    </div>
  );
};

export default SellerInfo;
