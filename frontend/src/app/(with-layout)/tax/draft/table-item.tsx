import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import {
  TaxDocumentTypeColorMap,
  TaxDraftStatusColorMap,
} from '@/types/status-type';
import Checkbox from '@/ui/checkbox';
import Chip from '@/ui/chip';

interface TableItemProps {
  item: PublishedTaxInvoiceResponseModel;
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
  const chipText =
    item.publish_status === 'temporary'
      ? '임시 저장'
      : item.publish_status === 'pending'
        ? '전송 대기'
        : '-';

  return (
    <div
      className="flex items-center h-14 min-w-[1272px] border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onItemClick}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox isChecked={isChecked} onToggle={onToggle} />
      </div>
      <div className="px-3 w-[150px]">
        {chipText === '-' ? (
          <span className="text-dg">-</span>
        ) : (
          <Chip
            text={chipText}
            bgColor={
              TaxDraftStatusColorMap[
                chipText as keyof typeof TaxDraftStatusColorMap
              ].bgColor
            }
            textColor={
              TaxDraftStatusColorMap[
                chipText as keyof typeof TaxDraftStatusColorMap
              ].textColor
            }
          />
        )}
      </div>
      <div className="px-3 flex-2">
        <Chip
          text={item.tax_invoice_type === 'sales' ? '매출' : '매입'}
          bgColor={
            TaxDocumentTypeColorMap[
              item.tax_invoice_type as keyof typeof TaxDocumentTypeColorMap
            ].bgColor
          }
          textColor={
            TaxDocumentTypeColorMap[
              item.tax_invoice_type as keyof typeof TaxDocumentTypeColorMap
            ].textColor
          }
        />
      </div>

      <p className="px-3 flex-2 truncate" title={item.client_info?.name || '-'}>
        {item.client_info?.name || '-'}
      </p>
      <p
        className="px-3 w-[200px] truncate"
        title={item.transaction_amount?.toLocaleString() || '-'}
      >
        {item.transaction_amount?.toLocaleString() || '-'}
      </p>
      <p
        className="px-3 w-[200px] truncate"
        title={item.tax_amount?.toLocaleString() || '-'}
      >
        {item.tax_amount?.toLocaleString() || '-'}
      </p>
      <p
        className="px-3 w-[200px] truncate"
        title={`${(item.transaction_amount || 0) + (item.tax_amount || 0)}`.toLocaleString()}
      >
        {`${(item.transaction_amount || 0) + (item.tax_amount || 0)}`.toLocaleString()}
      </p>
      <p
        className="px-3 w-[200px] truncate"
        title={item.transaction_date || '-'}
      >
        {item.transaction_date || '-'}
      </p>
    </div>
  );
};

export default TableItem;
