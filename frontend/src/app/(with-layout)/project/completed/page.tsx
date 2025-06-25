"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import completedProjectData from "@/mocks/completed-project-data";
import { CompletedProjectStatusType } from "@/types/status-type";

const CompletedProjectPage = () => {
  const [selectedStatus, setSelectedStatus] = useState<
    "전체" | CompletedProjectStatusType
  >("전체");
  const [isDeleteBtnClicked, setIsDeleteBtnClicked] = useState(false);

  const filteredProjects =
    selectedStatus === "전체"
      ? completedProjectData
      : completedProjectData.filter((item) => item.status === selectedStatus);

  return (
    <div className="flex flex-col gap-8">
      <MainTitleSec
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />
      <div className="px-8">
        <SearchDeleteTable
          isDeleteBtnClicked={isDeleteBtnClicked}
          setIsDeleteBtnClicked={setIsDeleteBtnClicked}
        />
        <div>
          <TableHeader />
          {filteredProjects.map((item) => (
            <TableItem key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompletedProjectPage;
