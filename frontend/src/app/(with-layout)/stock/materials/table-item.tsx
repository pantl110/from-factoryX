"use client";
import Chip from "@/ui/chip";
import React from "react";

const TableItem = () => {
  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer">
      <p className="flex-1 px-3 text-dg">알루미늄 시트</p>
      <p className="flex-1 px-3 text-dg">RM-001</p>
      <p className="w-[80px] px-3 text-dg">EA</p>
      <p className="flex-1 px-3 text-dg">5,000</p>
      <div className="px-3 w-[100px]">
        <Chip
          text="충분"
          bgColor="bg-primary-8"
          textColor="text-primary"
          sm={true}
        />
      </div>
      <p className="flex-1 px-3 text-dg">2,000</p>
      <p className="flex-1 px-3 text-dg">오른쪽 창고 아래</p>
      <p className="flex-1 px-3 text-dg">2025-06-04</p>
    </div>
  );
};

export default TableItem;
