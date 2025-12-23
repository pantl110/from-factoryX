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
  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-50">
          <Spinner />
        </div>
      ) : items && items.length > 0 ? (
        <>
          <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1">
            <p className="flex-1 px-3">구분</p>
            <div
              className="px-3 w-[150px] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
              onClick={onOrderingToggle}
            >
              <p className="">작성일자</p>
              <CaretUpDownIcon size={21} className="text-sv" />
            </div>
            <p className="flex-2 px-3">거래처명</p>
            <p className="flex-2 px-3">제품명</p>
            <p className="flex-2 px-3">공급가액</p>
            <p className="flex-2 px-3">세액</p>
            <p className="flex-2 px-3">합계금액</p>
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
        <NoHistoryBox text="세금계산서가 생성되면 이곳에서 확인 후, 프로젝트를 연결 할 수  있어요." />
      )}
    </div>
  );
};

export default LinkModalProjectTable;
