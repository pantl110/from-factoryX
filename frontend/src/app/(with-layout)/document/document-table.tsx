import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import DocumentTableItem from "./document-table-item";
import { DocumentType } from "./types";
import documentData from "@/mocks/document-data";
import { DocumentDataModel } from "@/mocks/document-data";

interface DocumentTableProps {
  selectedType: DocumentType | "전체";
  onDocumentClick?: (document: DocumentDataModel) => void;
}

const DocumentTable = ({
  selectedType,
  onDocumentClick,
}: DocumentTableProps) => {
  const filteredData =
    selectedType === "전체"
      ? documentData
      : documentData.filter((item) => item.documentType === selectedType);

  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
        <div className="py-1 px-3 flex gap-1 w-[150px] items-center">
          <p>문서유형</p>
          <CaretDownIcon size={20} />
        </div>
        <p className="py-1 px-3 flex-1">업체명</p>
        <p className="py-1 px-3 w-[150px]">등록일</p>
      </div>

      {filteredData.map((item, index) => (
        <DocumentTableItem
          key={index}
          data={item}
          onClick={() => onDocumentClick?.(item)}
        />
      ))}
    </div>
  );
};

export default DocumentTable;
