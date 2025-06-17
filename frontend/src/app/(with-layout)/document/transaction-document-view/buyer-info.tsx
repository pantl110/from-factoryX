import React from "react";
import InfoLabelValue from "@/ui/info-label-value";

const BuyerInfo = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">수요자 정보</h3>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <InfoLabelValue label="회사명" value="플라스틱이 좋아" />
          <InfoLabelValue label="사업자등록번호" value="123-45-67890" />
        </div>
        <InfoLabelValue label="대표자명" value="홍길동" />
        <div className="flex">
          <InfoLabelValue label="업태" value="제조업" />
          <InfoLabelValue label="종목" value="플라스틱 사출" />
        </div>
        <InfoLabelValue label="사업장 주소" value="경기도 남양주시" />
        <div className="flex">
          <InfoLabelValue label="담당자 이메일" value="company@mail.com" />
          <InfoLabelValue label="담당자 연락처" value="010-9876-5432" />
        </div>
        <InfoLabelValue label="담당자 팩스" value="02-987-6543" />
      </div>
    </div>
  );
};

export default BuyerInfo;
