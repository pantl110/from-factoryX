import { UnlinkedTaxInvoiceResponseModel } from '@/types/data-model';
import { TaxDocumentType, TaxDocumentTypeColorMap } from '@/types/status-type';
import Checkbox from '@/ui/checkbox';
import Chip from '@/ui/chip';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';

interface LinkModalTableItemProps {
  onItemClick: () => void;
  isChecked: boolean;
  onToggle: () => void;
  item: UnlinkedTaxInvoiceResponseModel;
}

const LinkModalTableItem = ({
  onItemClick,
  isChecked,
  onToggle,
  item,
}: LinkModalTableItemProps) => {
  const taxTypeMap: Record<string, TaxDocumentType> = {
    매출: 'sales',
    매입: 'purchase',
    sales: 'sales',
    purchase: 'purchase',
  };

  const mappedTaxType = taxTypeMap[item.tax_invoice_type] || 'sales';
  const { bgColor, textColor } = TaxDocumentTypeColorMap[mappedTaxType];

  return (
    <div
      className="flex items-center border-b border-lg h-14 w-full text-bl Me_Body-1 hover:bg-bg transition-colors duration-200 cursor-pointer"
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
          text={item.tax_invoice_type === 'sales' ? '매출' : '매입'}
          bgColor={bgColor}
          textColor={textColor}
        />
      </div>
      <p className="w-[150px] px-3 text-dg">{item.transaction_date}</p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={item.client_name || '-'}
      >
        {item.client_name || '-'}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={getProductNamesDisplay(item.product_names || []) || '-'}
      >
        {getProductNamesDisplay(item.product_names || []) || '-'}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={item.transaction_amount?.toLocaleString() || '0'}
      >
        {item.transaction_amount?.toLocaleString() || '0'}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={item.tax_amount?.toLocaleString() || '0'}
      >
        {item.tax_amount?.toLocaleString() || '0'}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={item.total_amount?.toLocaleString() || '0'}
      >
        {item.total_amount?.toLocaleString() || '0'}
      </p>
    </div>
  );
};

export default LinkModalTableItem;
