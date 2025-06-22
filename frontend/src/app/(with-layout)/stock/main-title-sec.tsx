"use client";

import MiniBtn from "@/ui/mini-btn";
import { StockTabType } from "./types";
import { CaretDown } from "@phosphor-icons/react";

interface MainTitleSecProps {
  selectedTab: StockTabType;
  onTabChange: (tab: StockTabType) => void;
}

const MainTitleSec = ({ selectedTab, onTabChange }: MainTitleSecProps) => {
  const handleTabClick = (tab: StockTabType) => {
    onTabChange(tab);
  };

  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <h1 className="Heading-1 text-dg">재고 관리</h1>
        <MiniBtn
          bgColor="bg-primary"
          textColor="text-white"
          text="품목 추가하기"
          icon={CaretDown}
          iconPosition="right"
          iconColor="text-white"
          hoverColor="hover:bg-[#005DC7]"
        />
      </div>
      <div className="flex gap-4 Heading-3">
        <button
          type="button"
          className={`${selectedTab === "product" ? "text-bl" : "text-gr"} cursor-pointer`}
          onClick={() => handleTabClick("product")}
        >
          품목
        </button>
        <button
          type="button"
          className={`${selectedTab === "material" ? "text-bl" : "text-gr"} cursor-pointer`}
          onClick={() => handleTabClick("material")}
        >
          원자재
        </button>
      </div>
    </div>
  );
};

export default MainTitleSec;
