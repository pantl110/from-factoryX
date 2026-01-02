import { useTranslations } from 'next-intl';
import { MaterialHistoryResponseModel } from '@/types/data-model';
import LinkModalTaxTableItem from './link-modal-tax-table-item';
import Pagination from '@/components/pagination';
import NoHistoryBox from '@/ui/no-history-box';
import Spinner from '@/ui/spinner';

interface LinkModalTaxTableProps {
  items: MaterialHistoryResponseModel[];
  isLoading: boolean;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const LinkModalTaxTable = ({
  items,
  isLoading,
  selectedId,
  setSelectedId,
  currentPage,
  totalPages,
  onPageChange,
}: LinkModalTaxTableProps) => {
  const t = useTranslations('tax');
  const tCommon = useTranslations('common');

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-50">
          <Spinner />
        </div>
      ) : items && items.length > 0 ? (
        <>
          <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1">
            <p className="flex-[1.5] px-3">{tCommon('materialName')}</p>
            <p className="flex-1 px-3">{tCommon('specification')}</p>
            <p className="flex-[0.7] px-3">{tCommon('quantity')}</p>
            <p className="flex-[0.5] px-3">{tCommon('unit')}</p>
            <p className="flex-[0.7] px-3">{tCommon('unitPrice')}</p>
            <p className="flex-1 px-3">{tCommon('amount')}</p>
            <p className="flex-1 px-3">{tCommon('transactionDate')}</p>
          </div>
          {items.map((item, index) => (
            <LinkModalTaxTableItem
              key={item.id || index}
              onItemClick={() =>
                setSelectedId?.(selectedId === item.id ? null : item.id)
              }
              isSelected={selectedId === item.id}
              item={item}
            />
          ))}
          {totalPages > 1 && onPageChange && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      ) : (
        <NoHistoryBox text={t('linkModal.taxTableEmptyText')} />
      )}
    </div>
  );
};

export default LinkModalTaxTable;
