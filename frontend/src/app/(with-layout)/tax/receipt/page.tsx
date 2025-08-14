'use client';

import { useState, useEffect } from 'react';
import SearchInput from '@/ui/search-input';
// import TableItem from './table-item';
import { CaretUpDownIcon } from '@phosphor-icons/react';
import Pagination from '@/components/pagination';
// import ReceiptDetailPanel from './modals/receipt-detail-panel';
import { useGetCashReceipts } from '@/hooks';
// import { CashReceiptResponseModel } from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';
import Spinner from '@/ui/spinner';
import NoHistoryBox from '@/ui/no-history-box';

const TaxReceiptPage = () => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 정렬 상태 관리
  const [searchQuery, setSearchQuery] = useState(''); // 검색어 상태
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  // const [selectedItem, setSelectedItem] =
  //   useState<CashReceiptResponseModel | null>(null);
  // const [isPanelOpen, setIsPanelOpen] = useState(false); // 패널 열기/닫기 상태 관리

  // 공장 ID 가져오기
  const factoryStore = useFactoryStore();
  const factoryId = factoryStore.factoryId || 1; // 기본값 1

  // 현금영수증 데이터 가져오기
  const { getCashReceipts, cashReceipts, isLoading, error, totalPages } =
    useGetCashReceipts();

  // 초기 데이터 로드 + 정렬 + 페이지 변경 (검색어 제외)
  useEffect(() => {
    if (factoryId) {
      getCashReceipts({
        factory_id: factoryId,
        order: sortOrder,
        q: searchQuery,
        page: currentPage,
        size: 10,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId, sortOrder, currentPage, getCashReceipts]);

  // 검색어 입력 완료 후 API 호출 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (factoryId) {
        getCashReceipts({
          factory_id: factoryId,
          order: 'desc',
          q: searchQuery,
          page: 1,
          size: 10,
        });
      }
    }, 300); // 300ms 디바운싱

    return () => clearTimeout(timer);
  }, [factoryId, searchQuery, getCashReceipts]);

  // 거래일자 정렬 핸들러
  const handleDateSort = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    // 정렬 변경 시 첫 페이지로 이동
    setCurrentPage(1);
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
  // const handleItemClick = (item: CashReceiptResponseModel) => {
  //   setSelectedItem(item);
  //   setIsPanelOpen(true);
  // };

  // 패널 닫기 핸들러
  // const handlePanelClose = () => {
  //   setIsPanelOpen(false);
  //   setSelectedItem(null);
  // };

  return (
    <div className="flex flex-col gap-8 pt-10 px-10">
      <div className="Heading-1 text-dg">현금영수증</div>

      <div>
        <SearchInput
          placeholder="찾고 싶은 현금영수증의 업체명을 입력하세요."
          onChange={handleSearchChange}
        />

        {isLoading || error ? (
          <div className="flex justify-center items-center h-100">
            <Spinner />
          </div>
        ) : (
          <div className="pb-10 mt-6">
            {cashReceipts.length === 0 ? (
              <NoHistoryBox title="현금영수증" text="현금영수증이 없습니다." />
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
                    <p className="flex-2 px-3">품목명</p>
                    <p className="flex-1 px-3">공급가액</p>
                    <p className="flex-1 px-3">세액</p>
                    <p className="flex-1 px-3">합계금액</p>
                  </div>

                  {/* {cashReceipts.map((item) => (
                    <TableItem
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item)}
                    />
                  ))} */}
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
      </div>

      {/* 현금영수증 상세 패널 */}
      {/* {isPanelOpen && selectedItem && (
        <ReceiptDetailPanel onClose={handlePanelClose} item={selectedItem} />
      )} */}
    </div>
  );
};

export default TaxReceiptPage;
