import { useCallback } from 'react';
import Pagination from '@/components/pagination';
import Checkbox from '@/ui/checkbox';
import { CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr';
import LinkModalTableItem from './link-modal-table-item';
import { UnlinkedTaxInvoiceResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import Spinner from '@/ui/spinner';

interface LinkModalTableProps {
  items: UnlinkedTaxInvoiceResponseModel[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  selectedId: number | null;
  setSelectedId: (id: number) => void;
}

const LinkModalTable = ({
  items,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isLoading,
  selectedId,
  setSelectedId,
}: LinkModalTableProps) => {
  const handleToggle = useCallback(
    (id: number) => {
      setSelectedId(id);
    },
    [setSelectedId]
  );
  const handleRowClick = useCallback(
    (id: number) => {
      setSelectedId(id);
    },
    [setSelectedId]
  );

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-[272px]">
          <Spinner />
        </div>
      ) : items && items.length > 0 ? (
        <>
          <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1">
            <div className="opacity-0">
              <Checkbox isChecked={false} onToggle={() => {}} />
            </div>
            <p className="flex-1 px-3">구분</p>
            <div className="px-3 w-[150px] h-full flex items-center gap-1 hover:bg-bg cursor-pointer">
              <p className="">작성일자</p>
              <CaretUpDownIcon size={21} className="text-sv" />
            </div>
            <p className="flex-2 px-3">업체명</p>
            <p className="flex-2 px-3">품목명</p>
            <p className="flex-2 px-3">공급가액</p>
            <p className="flex-2 px-3">세액</p>
            <p className="flex-2 px-3">합계금액</p>
          </div>
          {items.map((item, index) => (
            <LinkModalTableItem
              key={item.id || index}
              onItemClick={() => handleRowClick(item.id)}
              isChecked={selectedId === item.id}
              onToggle={() => handleToggle(item.id)}
              item={item}
            />
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange || (() => {})}
          />
        </>
      ) : (
        <NoHistoryBox
          title="연결할 세금계산서가 없습니다."
          text="연결할 세금계산서가 없습니다."
        />
      )}
    </div>
  );
};

export default LinkModalTable;
