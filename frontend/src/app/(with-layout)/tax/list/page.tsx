'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Suspense } from 'react';
import MainTitleSec from './main-title-sec';
import TableHeader from './table-header';
import TableItem from './table-item';
import TaxDetailPanel from '../tax-detail-panel';
import { TaxDocumentType } from '@/types/status-type';
import Spinner from '@/ui/spinner';
import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import Pagination from '@/components/pagination';
import EmptySpace from '@/ui/empty-space';
import { useGetPublishedTaxInvoices, useCheckAll } from '@/hooks';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

const TaxPageContent = () => {
  const [selectedTaxType, setSelectedTaxType] = useState<
    TaxDocumentType | '전체'
  >('전체');
  const [selectedItem, setSelectedItem] =
    useState<PublishedTaxInvoiceResponseModel | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { getPublishedTaxInvoices, isLoading, error } =
    useGetPublishedTaxInvoices();
  const [taxData, setTaxData] = useState<PublishedTaxInvoiceResponseModel[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // 디바운싱을 위한 ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 페이지네이션 설정
  const itemsPerPage = 10;

  // API에서 세금계산서 데이터 가져오기
  const fetchTaxData = useCallback(
    async (page: number = 1) => {
      const params: {
        ordering: string;
        page: number;
        size: number;
        q?: string;
        tax_invoice_type?: 'sales' | 'purchase';
        is_hidden?: boolean;
      } = {
        ordering:
          sortDirection === 'desc' ? '-transaction_date' : 'transaction_date',
        page,
        size: itemsPerPage,
      };

      if (searchQuery) {
        params.q = searchQuery;
      }

      if (selectedTaxType !== '전체') {
        params.tax_invoice_type =
          selectedTaxType === '매출' ? 'sales' : 'purchase';
      }

      // 기본적으로는 숨김 항목 제외, 숨긴 목록 보기 버튼을 누르면 숨김 항목만 표시
      if (showHidden) {
        params.is_hidden = true; // 숨김 항목만 표시
      } else {
        params.is_hidden = false; // 숨김 항목 제외
      }

      const result = await getPublishedTaxInvoices(params);
      if (result.success && result.data) {
        setTaxData(result.data.data);
        setTotalPages(result.data.pageCnt);
      }
    },
    [
      getPublishedTaxInvoices,
      sortDirection,
      searchQuery,
      selectedTaxType,
      showHidden,
    ]
  );

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchTaxData(1);
  }, [fetchTaxData]);

  // 페이지 변경 시 데이터 가져오기
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTaxData(page);
  };

  // 시작일자 정렬 방향 변경 시 데이터 가져오기
  const handleSortClick = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1); // 정렬 변경 시 페이지 1로 리셋
    fetchTaxData(1); // 정렬 변경 시에도 API 호출
  };

  // 탭 변경 시 페이지와 체크박스 상태 리셋
  useEffect(() => {
    setCurrentPage(1);
    setAllChecked(false);
    fetchTaxData(1); // 탭 변경 시에도 API 호출
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaxType]);

  // 검색어 변경 시 디바운싱 적용하여 데이터 가져오기
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // 이전 타이머가 있다면 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 300ms 후에 검색 실행
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // 검색 시 페이지 1로 리셋
      fetchTaxData(1);
    }, 300);
  };

  // 판넬 상태
  const handleOpenPanel = (item: PublishedTaxInvoiceResponseModel) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  };
  const handleClosePanel = () => {
    setSelectedItem(null);
    setIsPanelOpen(false);
  };

  const {
    checkedCount,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    isAllChecked,
  } = useCheckAll(taxData.map((item) => item.id));

  const handleToggleHidden = () => {
    setShowHidden(!showHidden);
    setCurrentPage(1); // 페이지를 1로 리셋
    setAllChecked(false); // 체크박스 상태 리셋
    // 숨김 상태 변경 시 데이터 다시 가져오기
    setTimeout(() => fetchTaxData(1), 0);
  };

  const handleHideRestore = () => {
    // 체크된 아이템들의 isHidden 상태를 변경
    const checkedIds = taxData
      .filter((item) => isChecked(item.id))
      .map((item) => item.id);

    // 실제로는 API 호출을 통해 서버에서 상태를 변경해야 함 ‼️‼️‼️수정 필요
    taxData.forEach((item) => {
      if (checkedIds.includes(item.id)) {
        // item.isHidden = !showHidden; // API 데이터에는 isHidden 필드가 없으므로 주석 처리
      }
    });

    setAllChecked(false); // 체크박스 상태 리셋
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="flex flex-col gap-8">
        <MainTitleSec
          selectedTaxType={selectedTaxType}
          setSelectedTaxType={setSelectedTaxType}
        />
        <div className="px-10 pb-10">
          <div className="flex items-center justify-between pb-4">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="찾고 싶은 세금계산서의 거래처나 품목명을 입력하세요."
            />
            <div className="flex gap-1">
              <MiniBtn
                text={checkedCount === 0 ? '숨긴 목록 보기' : '취소'}
                textColor="text-dg"
                borderColor={showHidden ? 'border-none' : 'border-lg'}
                bgColor={showHidden ? 'bg-bg' : 'bg-white'}
                hoverColor="hover:bg-bg"
                onClick={handleToggleHidden}
              />
              <MiniBtn
                text={
                  checkedCount === 0
                    ? showHidden
                      ? '복구'
                      : '숨기기'
                    : checkedCount === taxData.length
                      ? showHidden
                        ? '전체 항목 복구'
                        : '전체 항목 숨기기'
                      : showHidden
                        ? `${checkedCount}개 항목 복구`
                        : `${checkedCount}개 항목 숨기기`
                }
                textColor={checkedCount === 0 ? 'text-dg' : 'text-white'}
                borderColor={checkedCount === 0 ? 'border-lg' : 'border-none'}
                bgColor={checkedCount === 0 ? 'bg-white' : 'bg-primary'}
                hoverColor={
                  checkedCount === 0 ? 'hover:bg-bg' : 'hover:bg-primary-hover'
                }
                onClick={handleHideRestore}
              />
            </div>
          </div>

          {isLoading || error ? (
            <div className="flex items-center justify-center h-100">
              <Spinner />
            </div>
          ) : (
            <>
              {/* 테이블 */}
              {taxData.length === 0 ? (
                <EmptySpace
                  title={
                    showHidden
                      ? '아직 숨긴 세금계산서가 없어요.'
                      : taxData.length === 0
                        ? '아직 등록된 세금계산서가 없어요.'
                        : '세금계산서가 숨겨진 상태예요.'
                  }
                  description={
                    showHidden
                      ? '표시하지 않을 세금계산서를 숨기면 이곳에서 다시 볼 수 있어요.'
                      : taxData.length === 0
                        ? '세금계산서를 생성하면 이곳에서 확인할 수 있어요.'
                        : "숨긴 세금계산서를 다시 보려면, 상단의 '숨긴 목록 보기' 버튼을 눌러 복구해 주세요."
                  }
                  height="h-50"
                  className="mt-2"
                />
              ) : (
                <div className="w-full overflow-x-auto overflow-y-hidden">
                  <TableHeader
                    checkedCount={checkedCount}
                    onToggleAll={toggleAll}
                    onSortClick={handleSortClick}
                    sortDirection={sortDirection}
                    isAllChecked={isAllChecked}
                  />
                  {taxData.map((item) => (
                    <TableItem
                      key={item.id}
                      onItemClick={() => handleOpenPanel(item)}
                      item={item}
                      onToggle={() => toggleOne(item.id)}
                      isChecked={isChecked(item.id)}
                    />
                  ))}
                </div>
              )}
              {totalPages >= 2 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* 디테일 판넬 */}
      {isPanelOpen && selectedItem && (
        <TaxDetailPanel item={selectedItem} onClose={handleClosePanel} />
      )}
    </>
  );
};

const TaxPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <TaxPageContent />
    </Suspense>
  );
};

export default TaxPage;
