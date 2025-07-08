import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import DocumentTableItem from "./document-table-item";
import { DocumentDataModel } from "@/mocks/document-data";
import Checkbox from "@/ui/checkbox";

interface DocumentTableProps {
  data: DocumentDataModel[];
  onDocumentClick?: (document: DocumentDataModel) => void;
  isAllChecked: boolean;
  onToggleAll: () => void;
  isChecked: (id: string) => boolean;
  toggleOne: (id: string) => void;
}

const DocumentTable = ({
  data,
  onDocumentClick,
  isAllChecked,
  onToggleAll,
  isChecked,
  toggleOne,
}: DocumentTableProps) => {
  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
        <Checkbox
          isChecked={isAllChecked}
          onToggle={onToggleAll || (() => {})}
        />
        <div className="py-1 px-3 flex gap-1 w-[150px] items-center">
          <p>문서유형</p>
          <CaretDownIcon size={20} />
        </div>
        <p className="py-1 px-3 flex-1">업체명</p>
        <p className="py-1 px-3 w-[150px]">등록일</p>
      </div>

      {data.map((item, index) => (
        <DocumentTableItem
          key={index}
          data={item}
          onClick={() => onDocumentClick?.(item)}
          checked={isChecked(item.id)}
          onToggle={() => toggleOne(item.id)}
        />
      ))}
    </div>
  );
};

export default DocumentTable;
