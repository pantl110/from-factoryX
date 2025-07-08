"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import completedProjectData from "@/mocks/completed-project-data";
import { CompletedProjectStatusType } from "@/types/status-type";
import usePagination from "@/hooks/use-pagination";
import Pagination from "@/components/pagination";
import { useCheckAll } from "@/hooks/use-check-all";
import DeleteModal from "@/ui/modal/delete-modal";

const CompletedProjectPage = () => {
  const [selectedStatus, setSelectedStatus] = useState<
    "전체" | CompletedProjectStatusType
  >("전체");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredProjects =
    selectedStatus === "전체"
      ? completedProjectData
      : completedProjectData.filter((item) => item.status === selectedStatus);

  const {
    currentItems: currentProjects,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({
    items: filteredProjects,
    itemsPerPage: 10,
  }); // pagination hook

  const {
    checkedCount,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(filteredProjects.map((item) => item.id));

  const handleStatusChange = (status: "전체" | CompletedProjectStatusType) => {
    setSelectedStatus(status);
    setCurrentPage(1); // 상태 변경 시 첫 페이지로 이동
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <MainTitleSec
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
        />
        <div className="px-8">
          <SearchDeleteTable
            checkedCount={checkedCount}
            deleteButtonText={getDeleteButtonText()}
            onDelete={() => setIsDeleteModalOpen(true)}
            onCancel={() => setAllChecked(false)}
          />
          <div>
            <TableHeader checkedCount={checkedCount} onToggleAll={toggleAll} />
            {currentProjects.map((item) => (
              <TableItem
                key={item.id}
                {...item}
                checked={isChecked(item.id)}
                onToggle={() => toggleOne(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={() => setIsDeleteModalOpen(false)}
        />
      )}
    </>
  );
};

export default CompletedProjectPage;
