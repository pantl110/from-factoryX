import { useState } from "react";
import Chip from "@/ui/chip";
import Input from "@/ui/input";

const tabs = [
  { label: "납품" },
  { label: "생산 내역" },
  { label: "생산 현황" },
  { label: "생산 계획" },
  { label: "견적서" },
];

const ProductFlowTitle = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  return (
    <div className="px-10 pt-7">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <Chip text="납품" textColor="text-green" bgColor="bg-green-8" />
          <h1 className="Heading-1 text-dg">플라스틱이 좋아</h1>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <Input label="생산시작일" type="date" />
            <p className="w-[30px] h-[77px] pt-7 px-2 Re_Body-1 text-sv">__</p>
            <Input label="생산마감일" type="date" />
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-[#f5f5f5] w-[356px] Heading-5">
            <h6>납기일</h6>
            <h6>2025-07-31</h6>
          </div>
        </div>
      </div>
      <div className="h-[62px] border-b border-lg flex items-end">
        <div className="flex gap-4 pt-3 w-full">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setSelectedTab(idx)}
              className={`Heading-3 px-2 pb-2 transition-colors duration-150 ${
                selectedTab === idx
                  ? "text-primary border-b-2 border-primary"
                  : "text-gr border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFlowTitle;
