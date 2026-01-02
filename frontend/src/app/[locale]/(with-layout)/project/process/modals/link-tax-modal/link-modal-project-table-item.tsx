import { useTranslations } from 'next-intl';
import { UnlinkedTaxInvoiceResponseModel } from '@/types/data-model';
import { TaxDocumentType, TaxDocumentTypeColorMap } from '@/types/status-type';
import Chip from '@/ui/chip';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';

interface LinkModalProjectTableItemProps {
  onItemClick: () => void;
  isSelected: boolean;
  item: UnlinkedTaxInvoiceResponseModel;
}

const LinkModalProjectTableItem = ({
  onItemClick,
  isSelected,
  item,
}: LinkModalProjectTableItemProps) => {
  const t = useTranslations('tax');
  const taxTypeMap: Record<string, TaxDocumentType> = {
    [t('sales')]: 'sales',
    [t('purchase')]: 'purchase',
    sales: 'sales',
    purchase: 'purchase',
  };

  const mappedTaxType =
    item.tax_invoice_type === 'sales' || item.tax_invoice_type === 'purchase'
      ? item.tax_invoice_type
      : taxTypeMap[item.tax_invoice_type] || 'sales';
  const { bgColor, textColor } = TaxDocumentTypeColorMap[mappedTaxType];

  return (
    <div
      className={`flex items-center h-14 w-full text-bl Me_Body-1 transition-colors duration-200 cursor-pointer ${
        isSelected
          ? 'border border-primary bg-secondary'
          : 'border-b border-lg hover:bg-bg'
      }`}
      onClick={onItemClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onItemClick();
      }}
    >
      <div className="px-3 flex-1">
        <Chip
          text={
            item.tax_invoice_type === 'sales'
              ? t('sales')
              : item.tax_invoice_type === 'purchase'
                ? t('purchase')
                : t('sales')
          }
          bgColor={bgColor}
          textColor={textColor}
        />
      </div>
      <p className="w-[150px] px-3 text-dg">{item.transaction_date}</p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={item.client_info?.name?.trim() || '-'}
      >
        {item.client_info?.name?.trim() || '-'}
      </p>
      <p
        className="flex-2 px-3 text-dg truncate"
        title={getProductNamesDisplay(
          item.line_items
            ?.map((lineItem) => lineItem.name)
            .filter((name) => name?.trim()) || []
        )}
      >
        {getProductNamesDisplay(
          item.line_items
            ?.map((lineItem) => lineItem.name)
            .filter((name) => name?.trim()) || []
        )}
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

export default LinkModalProjectTableItem;
