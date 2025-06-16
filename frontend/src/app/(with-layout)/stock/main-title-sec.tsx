"use client";

import MiniBtn from "@/ui/mini-btn";
import React from "react";
import { useRouter } from "next/navigation";

interface MainTitleSecProps {
  selectedTab: string;
}

const MainTitleSec = ({ selectedTab }: MainTitleSecProps) => {
  const router = useRouter();

  const handleTabClick = (tab: string) => {
    router.push(`/stock/${tab}`);
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
          className={`${selectedTab === "materials" ? "text-bl" : "text-gr"} cursor-pointer`}
          onClick={() => handleTabClick("materials")}
        >
          원자재
        </h3>
      </div>
    </div>
  );
};

export default MainTitleSec;
