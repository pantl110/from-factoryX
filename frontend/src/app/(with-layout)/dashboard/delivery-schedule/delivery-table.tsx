"use client";

import { projectData } from "@/mocks/project-data";
import DeliveryTableItem from "./delivery-table-item";
import { useState } from "react";
import MiniBtn from "@/ui/mini-btn";

const DeliveryTable = () => {
  const [visibleCount, setVisibleCount] = useState(5);

  return (
    <div>
      <div className="flex w-full h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
        <p className="px-3 w-[150px]">프로젝트명</p>
        <p className="px-3 flex-1">품목명</p>
        <p className="px-3 flex-1">납품일자</p>
        <div className="w-10"></div>
      </div>
      {projectData.slice(0, visibleCount).map((project) => (
        <DeliveryTableItem
          key={project.id}
          projectName={project.companyName}
          productName={project.productName || ""}
          date={project.endDate}
        />
      ))}
      {visibleCount < projectData.length && (
        <div className="mt-3" onClick={() => setVisibleCount(visibleCount + 5)}>
          <MiniBtn
            text="5개씩 더보기"
            textColor="text-dg"
            hoverColor="hover:bg-bg"
            borderColor="border-lg"
            width="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default DeliveryTable;
