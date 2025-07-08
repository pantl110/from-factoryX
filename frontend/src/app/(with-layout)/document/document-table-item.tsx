import { DocumentDataModel } from "@/mocks/document-data";
import Chip from "@/ui/chip";
import { DocumentTypeColorMap } from "./types";
import Checkbox from "@/ui/checkbox";

interface DocumentTableItemProps {
  data: DocumentDataModel;
  onClick?: () => void;
  checked: boolean;
  onToggle: () => void;
  isTaxDocument?: boolean;
}

const DocumentTableItem = ({
  data,
  onClick,
  checked,
  onToggle,
  isTaxDocument = false,
}: DocumentTableItemProps) => {
  const {
    documentType,
    companyName,
    productName,
    date,
    supplyPrice,
    taxPrice,
    totalPrice,
    writtenDate,
  } = data;
  const { bgColor, textColor } = DocumentTypeColorMap[documentType];

  return (
    <div
      className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <Checkbox isChecked={checked} onToggle={onToggle} />
      {isTaxDocument ? (
        <>
          <p className="px-3 flex-1">{companyName}</p>
          <p className="px-3 flex-1">{productName}</p>
          <p className="px-3 flex-1">{supplyPrice?.toLocaleString() || "-"}</p>
          <p className="px-3 flex-1">{taxPrice?.toLocaleString() || "-"}</p>
          <p className="px-3 flex-1">{totalPrice?.toLocaleString() || "-"}</p>
          <p className="px-3 w-[150px]">{writtenDate || "-"}</p>
          <p className="px-3 w-[150px]">{date}</p>
        </>
      ) : (
        <>
          <div className="px-3 flex-[0.5]">
            <Chip text={documentType} bgColor={bgColor} textColor={textColor} />
          </div>
          <p className="px-3 flex-1">{companyName}</p>
          <p className="px-3 flex-1">{productName}</p>
          <p className="px-3 flex-[0.5]">{date}</p>
        </>
      )}
    </div>
  );
};

export default DocumentTableItem;
