"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";

const TaxDraftPage = () => {
  const [selectedTab, setSelectedTab] = useState<"전체" | "영수" | "청구">(
    "전체",
  );
  return (
    <div className={`flex flex-col gap-8`}>
      <MainTitleSec selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      <div className="px-8">
        {/* <SearchDeleteTable
          checkedCount={checkedCount}
          deleteButtonText={getDeleteButtonText()}
          onDelete={() => {}}
          onCancel={() => setAllChecked(false)}
        /> */}
      </div>
    </div>
  );
};

export default TaxDraftPage;
