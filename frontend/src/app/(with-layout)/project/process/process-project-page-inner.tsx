"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import SearchDeleteTable from "@/ui/search-delete-table";
import { projectData } from "@/mocks/project-data";
import { ProjectStatusType } from "@/types/status-type";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import SelectModal from "./modals/select-modal";
import UploadModal from "./modals/upload-modal";
import { useSearchParams, useRouter } from "next/navigation";
import Pagination from "@/components/pagination";
import usePagination from "@/hooks/use-pagination";
import { ClientDataModel } from "@/types/data-model";

const ProcessProjectPageInner = () => {
  const router = useRouter();
  // dashboard 페이지에서 접근 시 견적 협의 탭으로 이동
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  // 탭 상태
  const [selectedStatus, setSelectedStatus] = useState<
    ProjectStatusType | "전체"
  >(
    tab === "quote" ? "견적 협의" : tab === "inProduction" ? "생산 중" : "전체",
  );
  // 모달 상태
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  // 버튼 상태
  const [isDeleteBtnClicked, setIsDeleteBtnClicked] = useState(false);

  const filteredProjects =
    selectedStatus === "전체"
      ? projectData
      : projectData.filter((project) => project.status === selectedStatus);

  const {
    currentItems: currentProjects,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({
    items: filteredProjects,
    itemsPerPage: 10,
  }); // pagination hook

  const handleNewQuotation = () => {
    setIsSelectModalOpen(true);
  };
  const handleOpenUploadModal = () => {
    setIsSelectModalOpen(false);
    setIsUploadModalOpen(true);
  };
  const handleStatusChange = (status: ProjectStatusType | "전체") => {
    setSelectedStatus(status);
    setCurrentPage(1); // 상태 변경 시 표는 첫 페이지로 이동
  };

  const handleDirectInputClick = (clientData?: ClientDataModel) => {
    if (clientData) {
      // clientData가 있으면 URL 파라미터로 전달
      const params = new URLSearchParams();
      params.set("clientData", JSON.stringify(clientData));
      router.push(`/quotation?${params.toString()}`);
    } else {
      // clientData가 없으면 빈 값으로 이동
      router.push("/quotation");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <MainTitleSec
          onNewQuotation={handleNewQuotation}
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
        />
        <div className="px-8">
          <SearchDeleteTable
            isDeleteBtnClicked={isDeleteBtnClicked}
            setIsDeleteBtnClicked={setIsDeleteBtnClicked}
          />
          <div className="overflow-y-auto w-full scrollbar-hide">
            <TableHeader isDeleteBtnClicked={isDeleteBtnClicked} />
            {currentProjects.map((project) => (
              <TableItem
                key={project.id}
                id={project.id}
                status={project.status}
                companyName={project.companyName}
                items={project.items}
                startDate={project.startDate}
                endDate={project.endDate}
                transactionIssued={project.transactionIssued}
                taxIssued={project.taxIssued}
                isDeleteBtnClicked={isDeleteBtnClicked}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* 모달 */}
      {isSelectModalOpen && (
        <SelectModal
          onClose={() => setIsSelectModalOpen(false)}
          onUploadClick={handleOpenUploadModal}
          onDirectInputClick={handleDirectInputClick}
        />
      )}
      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onComplete={handleDirectInputClick}
        />
      )}
    </>
  );
};

export default ProcessProjectPageInner;
