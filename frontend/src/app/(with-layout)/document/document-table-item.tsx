import { DocumentTypeColorMap } from "@/types/status-type";
import { DocumentDataModel } from "@/mocks/document-data";
import Chip from "@/ui/chip";

interface DocumentTableItemProps {
  data: DocumentDataModel;
}

const DocumentTableItem = ({ data }: DocumentTableItemProps) => {
  const { documentType, companyName, date } = data;
  const { bgColor, textColor } = DocumentTypeColorMap[documentType];

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1">
      <div className="px-3 w-[150px]">
        <Chip text={documentType} bgColor={bgColor} textColor={textColor} />
      </div>
      <p className="px-3 flex-1">{companyName}</p>
      <p className="px-3 w-[150px]">{date}</p>
    </div>
  );
};

export default DocumentTableItem;
