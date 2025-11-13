'use client';

import { useState, useEffect, useCallback } from 'react';
import { Suspense } from 'react';
import { useDebounce } from 'use-debounce';
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
import {
  useGetPublishedTaxInvoices,
  useCheckAll,
  useUpdateTaxInvoice,
} from '@/hooks';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import NotAllowed from '../not-allowed';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

const TaxPageContent = () => {
  const role = useMemberStore((state) => state.role);
  const factoryId = useMemberStore((state) => state.factoryId);
  // 구독 상태 확인
  const { isPartnersSubscription } = useSubscriptionStore();

  const [selectedTaxType, setSelectedTaxType] =
    useState<TaxDocumentType | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<PublishedTaxInvoiceResponseModel | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasItem, setHasItem] = useState(false); // 세금계산서 데이터 존재 여부

  const { getPublishedTaxInvoices, isLoading } = useGetPublishedTaxInvoices();
  const { updateTaxInvoice: updateTaxInvoiceApi } = useUpdateTaxInvoice();
  const [isHideRestoreLoading, setIsHideRestoreLoading] = useState(false); // 숨기기/복구 작업 중 로딩 상태
  const [taxData, setTaxData] = useState<PublishedTaxInvoiceResponseModel[]>(
    []
  );
  // 디바운싱된 검색어 (500ms 지연)
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  // 페이지네이션 설정
  const itemsPerPage = 10;

  // 숨김 데이터 존재 여부 확인 (일반 목록에 데이터가 없을 때만 호출됨)
  const checkHiddenDataExists = async () => {
    try {
      const hiddenResult = await getPublishedTaxInvoices({
        ordering:
          sortDirection === 'desc' ? '-transaction_date' : 'transaction_date',
        page: 1,
        page_size: 1, // 1개만 확인
        is_hidden: true,
      });

      if (hiddenResult.success && hiddenResult.data) {
        const hasHiddenData = hiddenResult.data.data.length > 0;
        setHasItem(hasHiddenData);
      } else {
        setHasItem(false);
      }
    } catch {
      setHasItem(false);
    }
  };

  // API에서 세금계산서 데이터 가져오기
  const fetchTaxData = useCallback(
    async (page: number = 1) => {
      const params: {
        ordering: string;
        page: number;
        page_size: number;
        q?: string;
        tax_invoice_type?: 'sales' | 'purchase';
        is_hidden?: boolean;
      } = {
        ordering:
          sortDirection === 'desc' ? '-transaction_date' : 'transaction_date',
        page,
        page_size: itemsPerPage,
      };

      if (debouncedSearchQuery) {
        params.q = debouncedSearchQuery;
      }

      // 매출/매입 탭에 따른 필터링
      if (selectedTaxType === 'sales') {
        params.tax_invoice_type = 'sales';
      } else if (selectedTaxType === 'purchase') {
        params.tax_invoice_type = 'purchase';
      }
      // null(전체 탭)일 때는 tax_invoice_type 파라미터를 보내지 않음

      // 기본적으로는 숨김 항목 제외, 숨긴 목록 보기 버튼을 누르면 숨김 항목만 표시
      if (showHidden) {
        params.is_hidden = true; // 숨김 항목만 표시
      } else {
        params.is_hidden = false; // 숨김 항목 제외 (일반 목록 표시)
      }

      const result = await getPublishedTaxInvoices(params);
      if (result.success && result.data) {
        setTaxData(result.data.data);
        setTotalPages(result.data.pageCnt);

        if (showHidden) {
          // 숨김 목록 보기 중일 때는 현재 데이터가 있으면 true
          setHasItem(result.data.data.length > 0);
        } else {
          // 일반 목록 보기 중일 때
          if (result.data.data.length > 0) {
            // 일반 목록에 데이터가 있으면 무조건 true
            setHasItem(true);
          } else {
            // 일반 목록에 데이터가 없으면 숨김 목록 확인
            await checkHiddenDataExists();
          }
        }
      } else {
        // API 요청 실패 시에는 hasItem을 false로 설정
        setHasItem(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sortDirection,
      selectedTaxType,
      showHidden,
      debouncedSearchQuery,
      factoryId,
    ]
  );

  // factoryId 초기화
  useEffect(() => {
    fetchTaxData(1);
  }, [fetchTaxData]);

  // 탭 변경 시 페이지와 체크박스 상태 리셋
  useEffect(() => {
    setCurrentPage(1);
    setAllChecked(false);
    setSearchQuery(''); // 검색어 초기화
    // showHidden 상태는 유지 (탭 변경 시에도 숨김 목록 보기 상태 유지)
    fetchTaxData(1); // 탭 변경 시에도 API 호출
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaxType]);

  // showHidden 상태 변경 시 데이터 새로 가져오기
  useEffect(() => {
    setCurrentPage(1);
    setAllChecked(false);
    fetchTaxData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHidden]);

  // 페이지 변경 시
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTaxData(page);
  };

  // 숨기기/복구 후 현재 페이지가 총 페이지 수보다 크면 이전 페이지로 이동
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
      fetchTaxData(totalPages);
    }
  }, [totalPages, currentPage, fetchTaxData]);

  // 시작일자 정렬 방향 변경
  const handleSortClick = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1); // 정렬 변경 시 페이지 1로 리셋
    fetchTaxData(1); // 정렬 변경 시에도 API 호출
  };

  // 검색어 변경 시
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // 검색 시 페이지 1로 리셋
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
    // "취소" 버튼일 때는 체크박스만 해제
    if (checkedCount > 0) {
      setAllChecked(false);
      return;
    }

    setShowHidden(!showHidden);
    setCurrentPage(1); // 페이지를 1로 리셋
    setAllChecked(false); // 체크박스 상태 리셋
    // showHidden 상태 변경 시 useEffect가 자동으로 fetchTaxData를 호출함
  };

  const handleHideRestore = async () => {
    // 체크된 아이템들의 ID 추출
    const checkedIds = taxData
      .filter((item) => isChecked(item.id))
      .map((item) => item.id);

    if (checkedIds.length === 0) return;

    setIsHideRestoreLoading(true); // 로딩 시작

    try {
      // 체크된 모든 세금계산서의 숨김 상태를 변경
      const updatePromises = checkedIds.map((taxId) => {
        const taxItem = taxData.find((item) => item.id === taxId);
        if (!taxItem)
          return Promise.resolve({
            success: false,
            error: '세금계산서를 찾을 수 없습니다.',
          });

        return updateTaxInvoiceApi(taxId, {
          factory: taxItem.factory,
          transaction_amount: taxItem.transaction_amount, // 필수 필드
          tax_amount: taxItem.tax_amount, // 필수 필드
          is_hidden: !showHidden, // 현재 상태와 반대로 변경
        });
      });

      // 모든 업데이트 요청을 병렬로 처리
      const results = await Promise.all(updatePromises);

      // 성공한 요청들 확인
      const successCount = results.filter(
        (result: { success: boolean }) => result.success
      ).length;

      if (successCount > 0) {
        // 성공적으로 업데이트된 경우 데이터 새로고침
        fetchTaxData(currentPage);
        setAllChecked(false); // 체크박스 상태 리셋
        setSearchQuery(''); // 검색어 초기화
      } else {
        alert('세금계산서 숨김/복구에 실패했습니다.');
      }
    } catch (error) {
      alert('세금계산서 숨김/복구 중 오류 발생: ' + error);
    } finally {
      setIsHideRestoreLoading(false); // 로딩 종료
    }
  };

  // PARTNERS 구독이 아니면 접근 차단
  if (!isPartnersSubscription()) {
    return <NotAllowed />;
  }

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
              placeholder="찾고 싶은 세금계산서의 거래처나 제품명을 입력하세요."
            />
            {/* 숨김 버튼: 숨김 목록 보기 중이거나, 일반 목록에서 데이터가 없고 숨김 데이터도 없을 때 */}
            {(showHidden || (!showHidden && hasItem)) && (
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
                    checkedCount === 0
                      ? 'hover:bg-bg'
                      : 'hover:bg-primary-hover'
                  }
                  onClick={handleHideRestore}
                  disabled={
                    checkedCount === 0 ||
                    isHideRestoreLoading ||
                    role === 'viewer'
                  }
                />
              </div>
            )}
          </div>

          {isLoading ? (
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
                      : hasItem
                        ? '세금계산서가 숨겨진 상태예요.'
                        : '아직 등록된 세금계산서가 없어요.'
                  }
                  description={
                    showHidden
                      ? '표시하지 않을 세금계산서를 숨기면 이곳에서 다시 볼 수 있어요.'
                      : hasItem
                        ? "숨긴 세금계산서를 다시 보려면, 상단의 '숨긴 목록 보기' 버튼을 눌러 복구해 주세요."
                        : '세금계산서를 생성하면 이곳에서 확인할 수 있어요.'
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
                  {taxData?.map((item) => (
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
        <TaxDetailPanel
          itemId={selectedItem.id}
          onClose={handleClosePanel}
          canLink={true}
        />
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
