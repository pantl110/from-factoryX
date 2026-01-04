import Pagination from '@/components/pagination';
import { CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr';
import LinkProjectTableItem from './link-project-table-item';
import { ProjectResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import Spinner from '@/ui/spinner';
import { useTranslations } from 'next-intl';

interface LinkProjectTableProps {
  items: ProjectResponseModel[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onOrderingToggle: () => void;
  isLoading?: boolean;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
}

const LinkProjectTable = ({
  items,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onOrderingToggle,
  isLoading,
  selectedId,
  setSelectedId,
}: LinkProjectTableProps) => {
  const tCommon = useTranslations('common');
  const tEmpty = useTranslations('tax.list.linkProjectModal.empty');

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-50">
          <Spinner />
        </div>
      ) : items && items.length > 0 ? (
        <>
          <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1">
            <p className="flex-[0.6] px-3">{tCommon('status')}</p>
            <p className="flex-1 px-3">{tCommon('clientName')}</p>
            <p className="flex-1 px-3">{tCommon('productName')}</p>
            <div
              className="px-3 flex-[0.8] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
              onClick={onOrderingToggle}
            >
              <p className="">{tCommon('productionDate')}</p>
              <CaretUpDownIcon size={21} className="text-sv" />
            </div>
          </div>
          {items.map((item, index) => (
            <LinkProjectTableItem
              key={item.id || index}
              onItemClick={() => {
                const projectId = item.id ? Number(item.id) : null;
                setSelectedId(selectedId === projectId ? null : projectId);
              }}
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
        <NoHistoryBox text={tEmpty('text')} />
      )}
    </div>
  );
};

export default LinkProjectTable;
