"use client";

import { useState, Suspense } from "react";
import SearchDeleteTable from "@/ui/search-delete-table";
import MainTitleSec from "./main-title-sec";
import DocumentTable from "./document-table";
// import Pagination from "@/components/pagination";
import { DocumentType } from "./types";
import OrderDocumentView from "./order-document-view";
import documentData, { DocumentDataModel } from "@/mocks/document-data";
import Panel from "@/ui/panel";
import ProductionDocumentView from "./production-document-view";
import TransactionDocumentView from "./transaction-document-view";
import TaxDocumentView from "./tax-document-view";
import Spinner from "@/ui/spinner";
import { useCheckAll } from "@/hooks/use-check-all";

const DocumentPageContent = () => {
  const [selectedType, setSelectedType] = useState<DocumentType>("주문서");
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentDataModel | null>(null);

  const filteredData = documentData.filter(
    (item) => item.documentType === selectedType,
  );
  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(filteredData.map((item) => item.id));

  const handleDocumentClick = (document: DocumentDataModel) => {
    setSelectedDocument(document);
  };

  return (
    <>
      <div className="flex flex-col gap-8 w-full">
        <MainTitleSec
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />

        <div className="px-8">
          <SearchDeleteTable
            checkedCount={checkedCount}
            deleteButtonText={getDeleteButtonText()}
            onDelete={() => {}}
            onCancel={() => setAllChecked(false)}
          />
          <DocumentTable
            data={filteredData}
            onDocumentClick={handleDocumentClick}
            isAllChecked={isAllChecked}
            onToggleAll={toggleAll}
            isChecked={isChecked}
            toggleOne={toggleOne}
          />
        </div>

        {/* <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} /> */}
      </div>

      {/* 판넬 */}
      {selectedDocument && selectedDocument.documentType === "주문서" && (
        <Panel title="주문서" onClose={() => setSelectedDocument(null)}>
          <OrderDocumentView />
        </Panel>
      )}
      {selectedDocument && selectedDocument.documentType === "생산지시서" && (
        <Panel title="생산지시서" onClose={() => setSelectedDocument(null)}>
          <ProductionDocumentView />
        </Panel>
      )}
      {selectedDocument && selectedDocument.documentType === "거래명세서" && (
        <Panel title="거래명세서" onClose={() => setSelectedDocument(null)}>
          <TransactionDocumentView />
        </Panel>
      )}
      {selectedDocument &&
        selectedDocument.documentType === "매출 세금계산서" && (
          <Panel title="세무/회계" onClose={() => setSelectedDocument(null)}>
            <TaxDocumentView taxType="매출" />
          </Panel>
        )}
      {selectedDocument &&
        selectedDocument.documentType === "매입 세금계산서" && (
          <Panel title="세무/회계" onClose={() => setSelectedDocument(null)}>
            <TaxDocumentView taxType="매입" />
          </Panel>
        )}
    </>
  );
};

const DocumentPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <DocumentPageContent />
    </Suspense>
  );
};

export default DocumentPage;
