import { PendingTaxInvoiceResponseModel } from '@/types/data-model';
import Checkbox from '@/ui/checkbox';
// import Chip from '@/ui/chip';

interface TableItemProps {
  item: PendingTaxInvoiceResponseModel;
  isChecked: boolean;
  onToggle: () => void;
  onItemClick?: () => void;
}

const TableItem = ({
  item,
  isChecked,
  onToggle,
  onItemClick,
}: TableItemProps) => {
  return (
    <div
      className="flex items-center h-14 min-w-[1272px] border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onItemClick}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox isChecked={isChecked} onToggle={onToggle} />
      </div>
      <div className="px-3 w-[150px]">
        {/* <Chip
          text={item.tax_invoice_type}
          bgColor={
            TaxDraftStatusColorMap[
              item.status as keyof typeof TaxDraftStatusColorMap
            ].bgColor
          }
          textColor={
            TaxDraftStatusColorMap[
              item.status as keyof typeof TaxDraftStatusColorMap
            ].textColor
          }
        /> */}
      </div>
      <p className="px-3 flex-2">{item.tax_invoice_type}</p>
      <p className="px-3 flex-2">{item.client_name}</p>
      <p className="px-3 w-[200px]">
        {item.transaction_amount.toLocaleString()}
      </p>
      <p className="px-3 w-[200px]">{item.tax_amount.toLocaleString()}</p>
      <p className="px-3 w-[200px]">{item.total_amount.toLocaleString()}</p>
      <p className="px-3 w-[200px]">{item.transaction_date}</p>
    </div>
  );
};

export default TableItem;
