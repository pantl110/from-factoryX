"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "@/app/(with-layout)/project/table-header";
import TableItem from "@/app/(with-layout)/project/table-item";
import { projectData } from "@/mocks/project-data";
import { ProjectStatusType } from "@/types/status-type";

const ProcessProjectPage = () => {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<
    ProjectStatusType | "전체"
  >("전체");

  const handleNewQuotation = () => {
    router.push("/quotation");
  };

  const filteredProjects =
    selectedStatus === "전체"
      ? projectData
      : projectData.filter((project) => project.status === selectedStatus);

  return (
    <div className="flex flex-col gap-8">
      <MainTitleSec
        onNewQuotation={handleNewQuotation}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />
      <div className="px-8">
        <SearchDeleteTable />
        <div>
          <TableHeader lastLabel="납기일자" />
          {filteredProjects.map((project) => (
            <TableItem
              key={project.id}
              id={project.id}
              status={project.status}
              companyName={project.companyName}
              items={project.items}
              startDate={project.startDate}
              endDate={project.endDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessProjectPage;
