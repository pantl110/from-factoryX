import Chip from "@/ui/chip";
import { TaxDocumentType, TaxDocumentTypeColorMap } from "@/types/status-type";

interface TableItemProps {
  onItemClick?: () => void;
  taxType: TaxDocumentType;
  date: string;
  company: string;
  supplyAmount: string;
  taxAmount: string;
  totalAmount: string;
}

const TableItem = ({
  onItemClick,
  taxType,
  date,
  company,
  supplyAmount,
  taxAmount,
  totalAmount,
}: TableItemProps) => {
  const { bgColor, textColor } = TaxDocumentTypeColorMap[taxType];
  return (
    <div
      className="flex items-center border-b border-lg h-14 w-full min-w-[1018px] text-bl Me_Body-1 hover:bg-gray-50 cursor-pointer"
      onClick={onItemClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onItemClick?.();
      }}
    >
      <div className="flex items-center py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>

      <div className="px-3 w-[150px]">
        <Chip text={taxType} bgColor={bgColor} textColor={textColor} />
      </div>
      <p className="w-[200px] px-3 text-dg">{date}</p>
      <p className="flex-1 px-3 text-dg">{company}</p>
      <p className="flex-1 px-3 text-dg">{supplyAmount}</p>
      <p className="flex-1 px-3 text-dg">{taxAmount}</p>
      <p className="flex-1 px-3 text-dg">{totalAmount}</p>
    </div>
  );
};

export default TableItem;
