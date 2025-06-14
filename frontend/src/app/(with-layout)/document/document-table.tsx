import React from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import DocumentTableItem from "./document-table-item";
import { DocumentType } from "./types";

interface DocumentTableProps {
  documentType: DocumentType;
}

const DocumentTable = ({ documentType }: DocumentTableProps) => {
  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
        <div className="py-1 px-3 flex gap-1 w-[150px] items-center">
          <p>문서유형</p>
          <CaretDown size={20} />
        </div>
        <p className="py-1 px-3 flex-1">업체명</p>
        <p className="py-1 px-3 w-[150px]">등록일</p>
      </div>

      {[...Array(9)].map((_, index) => (
        <DocumentTableItem
          key={index}
          // type={documentType}
        />
      ))}
    </div>
  );
};

export default DocumentTable;
