import Chip from "@/ui/chip";
import React from "react";

const DocumentTableItem = () => {
  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1">
      <div className="px-3 w-[150px]">
        <Chip text="견적서" bgColor="bg-bg" />
      </div>
      <p className="px-3 flex-1">플라스틱이 좋아</p>
      <p className="px-3 w-[150px]">2025-06-03</p>
    </div>
  );
};

export default DocumentTableItem;
