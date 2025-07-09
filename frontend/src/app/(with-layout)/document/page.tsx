"use client";

import { useState, Suspense } from "react";
import SearchDeleteTable from "@/ui/search-delete-table";
import MainTitleSec from "./main-title-sec";
import DocumentTable from "./document-table";
import Pagination from "@/components/pagination";
import { DocumentType } from "./types";
import OrderDocumentView from "./order-document-view";
import documentData, { DocumentDataModel } from "@/mocks/document-data";
import Panel from "@/ui/panel";
import ProductionDocumentView from "./production-document-view";
import TransactionDocumentView from "./transaction-document-view";
import TaxDocumentView from "./tax-document-view";
import Spinner from "@/ui/spinner";
import { useCheckAll } from "@/hooks/use-check-all";
import DeleteModal from "@/ui/modal/delete-modal";
import usePagination from "@/hooks/use-pagination";

const DocumentPageContent = () => {
  const [selectedType, setSelectedType] = useState<DocumentType>("주문서");
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentDataModel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredData = documentData.filter(
    (item) => item.documentType === selectedType,
  );

  const {
    currentItems: pagedData,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({ items: filteredData, itemsPerPage: 10 });

  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(pagedData.map((item) => item.id));

  const handleDocumentClick = (document: DocumentDataModel) => {
    setSelectedDocument(document);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(false);
    setAllChecked(false);
  };

  // 탭 변경 핸들러
  const handleTabChange = (type: DocumentType) => {
    setSelectedType(type);
    // 탭 변경 시 첫 페이지로 이동하고 체크박스 초기화
    setCurrentPage(1);
    setAllChecked(false);
  };

  return (
    <>
      <div className="flex flex-col gap-8 w-full">
        <MainTitleSec
          selectedType={selectedType}
          setSelectedType={handleTabChange}
        />

        <div className="px-10 pb-10">
          <SearchDeleteTable
            checkedCount={checkedCount}
            deleteButtonText={getDeleteButtonText()}
            onDelete={() => setIsDeleteModalOpen(true)}
            onCancel={() => setAllChecked(false)}
          />
          <DocumentTable
            data={pagedData}
            onDocumentClick={handleDocumentClick}
            isAllChecked={isAllChecked}
            onToggleAll={toggleAll}
            isChecked={isChecked}
            toggleOne={toggleOne}
            selectedType={selectedType}
          />
          {totalPages >= 2 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
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
          <Panel
            title="매출 세금계산서"
            onClose={() => setSelectedDocument(null)}
          >
            <TaxDocumentView taxType="매출" />
          </Panel>
        )}
      {selectedDocument &&
        selectedDocument.documentType === "매입 세금계산서" && (
          <Panel
            title="매입 세금계산서"
            onClose={() => setSelectedDocument(null)}
          >
            <TaxDocumentView taxType="매입" />
          </Panel>
        )}

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDelete}
        />
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
