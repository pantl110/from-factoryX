import React from "react";
import SupplierItem from "./supplier-item";

const SupplierInfo = () => {
  return (
    <div className="flex flex-col gap-3">
      <div className="Heading-3">공급자 정보</div>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <SupplierItem title="회사명" content="주식회사 팩토리엑스" />
          <SupplierItem title="사업자등록번호" content="987-65-43210" />
        </div>
        <div className="flex">
          <SupplierItem title="대표자명" content="유길정" />
          <SupplierItem title="납기일자" content="2025-06-10" />
        </div>
        <div className="flex">
          <SupplierItem title="업태" content="제조업" />
          <SupplierItem title="종목" content="금형 제작" />
        </div>
        <SupplierItem title="사업장 주소" content="경기도 남양주시" />
        <div className="flex">
          <SupplierItem title="담당자 이메일" content="company@mail.com" />
          <SupplierItem title="담당자 연락처" content="010-9876-5432" />
        </div>
        <SupplierItem title="담당자 팩스" content="02-987-6543" />
      </div>
    </div>
  );
};

export default SupplierInfo;
