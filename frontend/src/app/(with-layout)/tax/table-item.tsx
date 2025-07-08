import Chip from "@/ui/chip";
import { TaxDocumentType, TaxDocumentTypeColorMap } from "@/types/status-type";
import Checkbox from "@/ui/checkbox";

interface TableItemProps {
  onItemClick?: () => void;
  taxType: TaxDocumentType;
  date: string;
  company: string;
  supplyAmount: string;
  taxAmount: string;
  totalAmount: string;
  checked: boolean;
  onToggle: () => void;
}

const TableItem = ({
  onItemClick,
  taxType,
  date,
  company,
  supplyAmount,
  taxAmount,
  totalAmount,
  checked,
  onToggle,
}: TableItemProps) => {
  const { bgColor, textColor } = TaxDocumentTypeColorMap[taxType];
  return (
    <div
      className="flex items-center border-b border-lg h-14 w-full min-w-[1018px] text-bl Me_Body-1 hover:bg-bg transition-colors duration-200 cursor-pointer"
      onClick={onItemClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onItemClick?.();
      }}
    >
      <Checkbox isChecked={checked} onToggle={onToggle} />

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
