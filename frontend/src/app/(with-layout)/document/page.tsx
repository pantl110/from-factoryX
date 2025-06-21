"use client";

import { useState } from "react";
import SearchDeleteTable from "@/ui/search-delete-table";
import MainTitleSec from "./main-title-sec";
import DocumentTable from "./document-table";
import QuotationDocumentView from "./quotation-doument-view";
import ProductionDocumentView from "./production-document-view";
import TransactionDocumentView from "./transaction-document-view";
import Pagination from "@/components/pagination";
import { DocumentType } from "@/types/status-type";

const DocumentPage = () => {
  const [selectedType, setSelectedType] = useState<DocumentType | "전체">(
    "전체",
  );

  return (
    <>
      <div className="flex flex-col gap-8 w-full">
        <MainTitleSec
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />

        <div className="px-8">
          <SearchDeleteTable />
          <DocumentTable selectedType={selectedType} />
        </div>

        <Pagination />
      </div>

      <QuotationDocumentView />
      <ProductionDocumentView />
      <TransactionDocumentView />
    </>
  );
};

export default DocumentPage;
