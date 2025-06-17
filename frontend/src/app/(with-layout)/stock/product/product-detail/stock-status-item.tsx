import Chip from "@/ui/chip";
import React from "react";

const StockStausItem = () => {
  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 cursor-pointer">
      <p className="flex-1 px-3 text-dg">알루미늄 시트</p>
      <p className="flex-1 px-3 text-dg">PRM-001</p>
      <p className="flex-1 px-3 text-dg">2.0</p>
      <p className="w-[80px] px-3 text-dg">m</p>
      <div className="flex-1 px-3 text-dg">
        <Chip
          text="충분"
          sm={true}
          textColor="text-primary"
          bgColor="bg-primary-8"
        />
      </div>
      <p className="flex-1 px-3 text-dg">2026-07-09</p>
    </div>
  );
};

export default StockStausItem;
