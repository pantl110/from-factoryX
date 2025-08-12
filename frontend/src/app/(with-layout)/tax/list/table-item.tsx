import Chip from '@/ui/chip';
import { TaxDocumentTypeColorMap, TaxDocumentType } from '@/types/status-type';
import Checkbox from '@/ui/checkbox';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';

interface TableItemProps {
  onItemClick?: () => void;
  item: PublishedTaxInvoiceResponseModel;
  onToggle: () => void;
  isChecked: boolean;
}

const TableItem = ({
  onItemClick,
  item,
  onToggle,
  isChecked,
}: TableItemProps) => {
  const { bgColor, textColor } =
    TaxDocumentTypeColorMap[item.tax_invoice_type as TaxDocumentType];

  return (
    <div
      className="flex items-center border-b border-lg h-14 w-full min-w-[1192px] text-bl Me_Body-1 hover:bg-bg transition-colors duration-200 cursor-pointer"
      onClick={onItemClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onItemClick?.();
      }}
    >
      <Checkbox isChecked={isChecked} onToggle={onToggle} />
      <div className="px-3 flex-1">
        <Chip
          text={item.tax_invoice_type}
          bgColor={bgColor}
          textColor={textColor}
        />
      </div>
      <p className="w-[150px] px-3 text-dg">{item.transaction_date}</p>
      <p className="flex-2 px-3 text-dg truncate" title={item.client_name}>
        {item.client_name}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={getProductNamesDisplay(item.product_names)}
      >
        {getProductNamesDisplay(item.product_names)}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={item.transaction_amount.toLocaleString()}
      >
        {item.transaction_amount.toLocaleString()}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={item.tax_amount.toLocaleString()}
      >
        {item.tax_amount.toLocaleString()}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={item.total_amount.toLocaleString()}
      >
        {item.total_amount.toLocaleString()}
      </p>
    </div>
  );
};

export default TableItem;
