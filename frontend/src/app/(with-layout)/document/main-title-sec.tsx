import React from "react";

const MainTitleSec = () => {
  return (
    <div className="flex flex-col gap-8 pt-10 px-10">
      <h1 className="Heading-1 text-dg">문서함</h1>
      <div className="flex gap-4 items-center Heading-3">
        <h3 className="text-dg">전체</h3>
        <h3 className="text-gr">견적서</h3>
        <h3 className="text-gr">생산지시서</h3>
        <h3 className="text-gr">거래명세서</h3>
      </div>
    </div>
  );
};

export default MainTitleSec;
