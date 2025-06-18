"use client";

import React from "react";
import MiniBtn from "@/ui/mini-btn";
import { StockTabType } from "./types";

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
          text="품목 추가하기 "
        />
      </div>
      <div className="flex gap-4 Heading-3">
        <h3
          className={`${selectedTab === "product" ? "text-bl" : "text-gr"} cursor-pointer`}
          onClick={() => handleTabClick("product")}
        >
          품목
        </h3>
        <h3
          className={`${selectedTab === "material" ? "text-bl" : "text-gr"} cursor-pointer`}
          onClick={() => handleTabClick("material")}
        >
          원자재
        </h3>
      </div>
    </div>
  );
};

export default MainTitleSec;
