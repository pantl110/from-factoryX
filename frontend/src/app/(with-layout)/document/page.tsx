"use client";

import { useState } from "react";
import SearchDeleteTable from "@/ui/search-delete-table";
import MainTitleSec from "./main-title-sec";
import DocumentTable from "./document-table";
import { DocumentType } from "./types";

const DocumentPage = () => {
  const [selectedType, setSelectedType] = useState<DocumentType>("all");

  return (
    <div className="flex flex-col gap-2 w-full">
      <MainTitleSec
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />

      <div className="px-8">
        <SearchDeleteTable />
        <DocumentTable documentType={selectedType} />
      </div>

      {/* 페이지네이션 */}
    </div>
  );
};

export default DocumentPage;
