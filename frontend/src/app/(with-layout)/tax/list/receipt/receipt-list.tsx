'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { SearchInput, Spinner, EmptySpace } from '@/ui';
import TableItem from './table-item';
import { CaretUpDownIcon } from '@phosphor-icons/react';
import Pagination from '@/components/pagination';
import { useGetCashReceipts } from '@/hooks';
import { CashReceiptResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import AccountsPanel from '../accounts-panel';

interface ReceiptListProps {
  className?: string;
}

const ReceiptList = ({ className = '' }: ReceiptListProps) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] =
    useState<CashReceiptResponseModel | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false); // 패널 열기/닫기 상태 관리

  // 공장 ID 가져오기
  const factoryId = useMemberStore((state) => state.factoryId);

  // 디바운싱된 검색어 (300ms 지연)
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const itemsPerPage = 10;

  // useQuery 파라미터 구성
  const queryParams = useMemo(
    () => ({
      order: sortOrder,
      q: debouncedSearchQuery || undefined,
      page: currentPage,
      page_size: itemsPerPage,
    }),
    [sortOrder, debouncedSearchQuery, currentPage, itemsPerPage]
  );

  // 현금영수증 데이터 조회 (useQuery 사용)
  const {
    data: cashReceiptData,
    isLoading,
    isFetching,
  } = useGetCashReceipts(queryParams, {
    enabled: !!factoryId,
  });

  // cashReceipts와 totalPages 추출
  const cashReceipts = useMemo(
    () => cashReceiptData?.data || [],
    [cashReceiptData?.data]
  );
  const totalPages = useMemo(
    () => cashReceiptData?.pageCnt || 1,
    [cashReceiptData?.pageCnt]
  );

  // 거래일자 정렬 핸들러
  const handleDateSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 테이블 아이템 클릭 핸들러
  const handleItemClick = (item: CashReceiptResponseModel) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  };

  // 패널 닫기 핸들러
  const handlePanelClose = () => {
    setIsPanelOpen(false);
    setSelectedItem(null);
  };

  return (
    <>
      <div className={className}>
        <div className="pb-4">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="현금영수증의 업체명을 입력하세요."
          />
        </div>

        {isLoading || isFetching ? (
          <div className="flex justify-center items-center h-100">
            <Spinner />
          </div>
        ) : (
          <div className="pb-10">
            {cashReceipts.length === 0 ? (
              <EmptySpace
                title="아직 발급된 현금영수증이 없어요."
                description="발급 후 이곳에서 내역을 확인하실 수 있어요."
                height="h-50"
                className="mt-2"
              />
            ) : (
              <>
                <div className="w-full overflow-x-auto">
                  <div className="text-sv flex items-center w-full min-w-[1248px] h-12 border-t border-b border-[#eeeeee] Me_Body-1">
                    <div
                      className="px-3 flex-1 h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
                      onClick={handleDateSort}
                    >
                      <p className="">거래일자</p>
                      <CaretUpDownIcon size={21} className="text-sv" />
                    </div>
                    <p className="flex-2 px-3">업체명</p>
                    <p className="flex-2 px-3">제품명</p>
                    <p className="flex-1 px-3">공급가액</p>
                    <p className="flex-1 px-3">세액</p>
                    <p className="flex-1 px-3">합계금액</p>
                  </div>

                  {cashReceipts.map((item: CashReceiptResponseModel) => (
                    <TableItem
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* 매입채무 패널 */}
        {isPanelOpen && selectedItem && (
          <AccountsPanel
            onClose={handlePanelClose}
            itemId={selectedItem.id}
            type="cash-receipt"
          />
        )}
      </div>
    </>
  );
};

export default ReceiptList;
