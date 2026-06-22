import { useTranslations } from 'next-intl';
import Pagination from '@/components/pagination';
import { CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr';
import LinkModalProjectTableItem from './link-modal-project-table-item';
import { UnlinkedTaxInvoiceResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import Spinner from '@/ui/spinner';

interface LinkModalProjectTableProps {
  items: UnlinkedTaxInvoiceResponseModel[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onOrderingToggle: () => void;
  isLoading?: boolean;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
}

const LinkModalProjectTable = ({
  items,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onOrderingToggle,
  isLoading,
  selectedId,
  setSelectedId,
}: LinkModalProjectTableProps) => {
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
          <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-3">
            <p className="flex-1 px-3">{t('type')}</p>
            <div
              className="px-3 w-[150px] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
              onClick={onOrderingToggle}
            >
              <p className="">{tCommon('writtenDate')}</p>
              <CaretUpDownIcon size={21} className="text-sv" />
            </div>
            <p className="flex-2 px-3">{tCommon('clientName')}</p>
            <p className="flex-2 px-3">{tCommon('productName')}</p>
            <p className="flex-2 px-3">{tCommon('supplyAmount')}</p>
            <p className="flex-2 px-3">{t('taxAmount')}</p>
            <p className="flex-2 px-3">{tCommon('totalAmount')}</p>
          </div>
          {items.map((item, index) => (
            <LinkModalProjectTableItem
              key={item.id || index}
              onItemClick={() =>
                setSelectedId(selectedId === item.id ? null : item.id)
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
        <NoHistoryBox text={t('linkModal.emptyText')} />
      )}
    </div>
  );
};

export default LinkModalProjectTable;
