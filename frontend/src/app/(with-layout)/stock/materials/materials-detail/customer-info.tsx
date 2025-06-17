import InfoLabelValue from "@/ui/info-label-value";
import React from "react";

const CustomerInfo = () => {
  return (
    <div className="flex flex-col">
      <div className="flex">
        <InfoLabelValue label="거래처명" value="플라스틱이 좋아" />
        <InfoLabelValue label="사업자등록번호" value="123-45-67890" />
      </div>
      <div className="flex">
        <InfoLabelValue label="대표자명" value="홍길동" />
        <InfoLabelValue label="담당자 이메일" value="company@mail.com" />
      </div>
      <div className="flex">
        <InfoLabelValue label="담당자 연락처" value="010-1234-5678" />
        <InfoLabelValue label="팩스번호" value="02-123-4567" />
      </div>
      <div className="flex">
        <InfoLabelValue label="업태" value="제조업" />
        <InfoLabelValue label="종목" value="사출성형" />
      </div>
      <div className="flex">
        <InfoLabelValue
          label="사업장 주소"
          value="서울특별시 금천구 가산로123, 5층"
        />
        <InfoLabelValue label="거래 일자" value="2025-06-11" />
      </div>
    </div>
  );
};

export default CustomerInfo;
