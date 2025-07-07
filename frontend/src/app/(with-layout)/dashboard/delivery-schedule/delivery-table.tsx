"use client";

import { projectData } from "@/mocks/project-data";
import DeliveryTableItem from "./delivery-table-item";
import Pagination from "@/components/pagination";
import usePagination from "@/hooks/use-pagination";

const DeliveryTable = () => {
  const { currentItems, currentPage, totalPages, setCurrentPage } =
    usePagination({
      items: projectData,
      itemsPerPage: 5,
    });

  return (
    <div className="flex flex-col h-105 justify-between">
      <div>
        <div className="flex w-full h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
          <p className="px-3 w-[150px]">업체명</p>
          <p className="px-3 flex-1">품목명</p>
          <p className="px-3 flex-1">납품일자</p>
          <div className="w-10"></div>
        </div>
        {currentItems.map((project) => (
          <DeliveryTableItem
            key={project.id}
            projectName={project.companyName}
            productName={project.productName || ""}
            date={project.endDate}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}    </div>
  );
};

export default DeliveryTable;
