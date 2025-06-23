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

const ProcessProjectPage = () => {
  // 탭 상태
  const [selectedStatus, setSelectedStatus] = useState<
    ProjectStatusType | "전체"
  >("전체");
  // 모달 상태
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleNewQuotation = () => {
    setIsSelectModalOpen(true);
  };
  const handleOpenUploadModal = () => {
    setIsSelectModalOpen(false);
    setIsUploadModalOpen(true);
  };

  const filteredProjects =
    selectedStatus === "전체"
      ? projectData
      : projectData.filter((project) => project.status === selectedStatus);

  return (
    <>
      <div className="flex flex-col gap-8">
        <MainTitleSec
          onNewQuotation={handleNewQuotation}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
        <div className="px-8">
          <SearchDeleteTable />
          <div className="overflow-y-auto w-full">
            <TableHeader />
            {filteredProjects.map((project) => (
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
              />
            ))}
          </div>
        </div>
      </div>

      {/* 모달 */}
      {isSelectModalOpen && (
        <SelectModal
          onClose={() => setIsSelectModalOpen(false)}
          onUploadClick={handleOpenUploadModal}
        />
      )}
      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </>
  );
};

export default ProcessProjectPage;
