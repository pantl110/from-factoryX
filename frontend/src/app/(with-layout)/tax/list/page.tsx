'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Suspense } from 'react';
import { useDebounce } from 'use-debounce';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import MainTitleSec from './main-title-sec';
import TableHeader from './table-header';
import TableItem from './table-item';
import ReceiptList from './receipt/receipt-list';
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
import AccountsPanel from './accounts-panel';
import LinkProjectModal from './accounts-panel/modals/link-project-modal';

const TaxPageContent = () => {
  const role = useMemberStore((state) => state.role);
  // 구독 상태 확인
  const { isPartnersSubscription } = useSubscriptionStore();
  const searchParams = useSearchParams();

  // URL 쿼리 파라미터에서 탭 정보 읽기
  const tabParam = searchParams.get('tab');
  const initialTaxType: TaxDocumentType | null =
    tabParam === 'receipt'
      ? null
      : tabParam === 'purchase'
        ? 'purchase'
        : 'sales';

  const [selectedTaxType, setSelectedTaxType] =
    useState<TaxDocumentType | null>(initialTaxType);
  const [selectedItem, setSelectedItem] =
    useState<PublishedTaxInvoiceResponseModel | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLinkProjectModalOpen, setIsLinkProjectModalOpen] = useState(false);
  const [selectedTaxIdForLink, setSelectedTaxIdForLink] = useState<
    number | null
  >(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasItem, setHasItem] = useState(false); // 세금계산서 데이터 존재 여부

  const queryClient = useQueryClient();
  const { updateTaxInvoice: updateTaxInvoiceApi } = useUpdateTaxInvoice();
  const [isHideRestoreLoading, setIsHideRestoreLoading] = useState(false); // 숨기기/복구 작업 중 로딩 상태

  // 디바운싱된 검색어 (300ms 지연)
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // 페이지네이션 설정
  const itemsPerPage = 10;

  // useQuery 파라미터 구성
  const queryParams = useMemo(() => {
    if (selectedTaxType === null) {
      return {}; // 현금영수증 탭일 때는 빈 객체 반환
    }

    return {
      ordering:
        sortDirection === 'desc' ? '-transaction_date' : 'transaction_date',
      page: currentPage,
      page_size: itemsPerPage,
      q: debouncedSearchQuery || undefined,
      tax_invoice_type: selectedTaxType,
      is_hidden: showHidden,
    };
  }, [
    selectedTaxType,
    sortDirection,
    currentPage,
    debouncedSearchQuery,
    showHidden,
  ]);

  // 세금계산서 데이터 조회 (useQuery 사용)
  const isTaxQueryEnabled = selectedTaxType !== null;
  const {
    data: taxInvoiceData,
    isLoading,
    isFetching,
  } = useGetPublishedTaxInvoices(queryParams, {
    enabled: isTaxQueryEnabled,
  });

  // 숨김 데이터 존재 여부 확인용 쿼리 (일반 목록에 데이터가 없을 때만 호출됨)
  const taxDataLength = taxInvoiceData?.data.length ?? 0;
  const shouldCheckHidden = useMemo(
    () =>
      selectedTaxType !== null &&
      !showHidden &&
      taxDataLength === 0 &&
      !isLoading &&
      !isFetching,
    [selectedTaxType, showHidden, taxDataLength, isLoading, isFetching]
  );

  const hiddenCheckParams = useMemo(() => {
    if (!shouldCheckHidden || !selectedTaxType) {
      return {}; // 빈 객체 반환 (enabled가 false이므로 실행되지 않음)
    }
    return {
      ordering:
        sortDirection === 'desc' ? '-transaction_date' : 'transaction_date',
      page: 1,
      page_size: 1,
      tax_invoice_type: selectedTaxType,
      is_hidden: true,
    };
  }, [shouldCheckHidden, selectedTaxType, sortDirection]);

  const { data: hiddenCheckData } = useGetPublishedTaxInvoices(
    hiddenCheckParams,
    { enabled: shouldCheckHidden }
  );

  // taxData와 totalPages 추출
  const taxData = useMemo(
    () => taxInvoiceData?.data || [],
    [taxInvoiceData?.data]
  );
  const totalPages = useMemo(
    () => taxInvoiceData?.pageCnt || 0,
    [taxInvoiceData?.pageCnt]
  );

  // useCheckAll의 itemIds를 메모이제이션하여 불필요한 재생성 방지
  const itemIds = useMemo(
    () => (selectedTaxType === null ? [] : taxData.map((item) => item.id)),
    [selectedTaxType, taxData]
  );

  const {
    checkedCount,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    isAllChecked,
  } = useCheckAll(itemIds);

  // setAllChecked의 최신 참조를 유지하기 위한 ref
  const setAllCheckedRef = useRef(setAllChecked);
  useEffect(() => {
    setAllCheckedRef.current = setAllChecked;
  }, [setAllChecked]);

  // hasItem 상태 업데이트
  useEffect(() => {
    if (selectedTaxType === null) return;

    if (showHidden) {
      // 숨김 목록 보기 중일 때는 현재 데이터가 있으면 true
      setHasItem(taxData.length > 0);
    } else {
      // 일반 목록 보기 중일 때
      if (taxData.length > 0) {
        // 일반 목록에 데이터가 있으면 무조건 true
        setHasItem(true);
      } else {
        // 일반 목록에 데이터가 없으면 숨김 목록 확인
        setHasItem((hiddenCheckData?.data.length || 0) > 0);
      }
    }
  }, [
    showHidden,
    taxData.length,
    hiddenCheckData?.data.length,
    selectedTaxType,
  ]);

  // URL 쿼리 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const newTaxType: TaxDocumentType | null =
      tabParam === 'receipt'
        ? null
        : tabParam === 'purchase'
          ? 'purchase'
          : 'sales';
    if (newTaxType !== selectedTaxType) {
      setSelectedTaxType(newTaxType);
      // 탭 변경 시 페이지와 체크박스 상태 리셋
      setCurrentPage(1);
      setSearchQuery(''); // 검색어 초기화
      // 체크박스는 selectedTaxType이 변경되면 useCheckAll의 itemIds가 변경되므로 자동으로 리셋됨
    }
  }, [searchParams, selectedTaxType]);

  // showHidden 상태 변경 시 페이지 리셋
  useEffect(() => {
    if (selectedTaxType !== null) {
      setCurrentPage(1);
      // 체크박스는 showHidden 변경 시에도 자동으로 리셋되지 않으므로 명시적으로 리셋
      // showHidden이나 selectedTaxType이 변경될 때만 리셋 (checkedCount 변경 시에는 리셋하지 않음)
      setAllCheckedRef.current(false);
    }
  }, [showHidden, selectedTaxType]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지 유효성 관리 (숨김이나 비어 있는 페이지 처리)
  useEffect(() => {
    if (selectedTaxType !== null) {
      // 세금계산서 탭
      if (totalPages > 0 && currentPage > totalPages) {
        setCurrentPage(totalPages);
        return;
      }

      if (
        !isLoading &&
        !isFetching &&
        currentPage > 1 &&
        taxData.length === 0
      ) {
        const previousPage = currentPage - 1;
        setCurrentPage(previousPage);
      }
    }
  }, [
    totalPages,
    currentPage,
    isLoading,
    isFetching,
    taxData.length,
    selectedTaxType,
  ]);

  // 시작일자 정렬 방향 변경
  const handleSortClick = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1); // 정렬 변경 시 페이지 1로 리셋
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

  // 프로젝트 연결 모달 상태
  const handleOpenLinkProjectModal = (taxId: number) => {
    setSelectedTaxIdForLink(taxId);
    setIsLinkProjectModalOpen(true);
  };
  const handleCloseLinkProjectModal = () => {
    setIsLinkProjectModalOpen(false);
    setSelectedTaxIdForLink(null);
  };
  const handleLinkProjectSuccess = () => {
    // 프로젝트 연결 성공 후 목록 새로고침
    queryClient.invalidateQueries({
      queryKey: ['published-tax-invoices'],
    });
    handleCloseLinkProjectModal();
  };

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
        queryClient.invalidateQueries({
          queryKey: ['published-tax-invoices'],
        });
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
          {/* 세금계산서 탭일 때만 검색 input과 버튼 영역 표시 */}
          {selectedTaxType !== null && (
            <div className="flex items-center justify-between pb-4">
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="거래처명이나 제품명을 입력해 검색하세요."
              />
              {/* 숨김 버튼: 숨김 목록 보기 중이거나, 일반 목록에서 데이터가 없고 숨김 데이터도 없을 때 */}
              {(showHidden || (!showHidden && hasItem)) &&
                role &&
                !['viewer', 'prod_manager'].includes(role) && (
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
                            ? '복구하기'
                            : '숨기기'
                          : checkedCount === taxData.length
                            ? showHidden
                              ? '전체 항목 복구하기'
                              : '전체 항목 숨기기'
                            : showHidden
                              ? `${checkedCount}개 항목 복구하기`
                              : `${checkedCount}개 항목 숨기기`
                      }
                      variant={checkedCount > 0 ? 'red' : 'primary'}
                      onClick={handleHideRestore}
                      disabled={checkedCount === 0 || isHideRestoreLoading}
                    />
                  </div>
                )}
            </div>
          )}

          {selectedTaxType === null ? (
            // 현금영수증 탭
            <ReceiptList />
          ) : (
            // 세금계산서 탭
            <>
              {isLoading || isFetching ? (
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
                        taxType={selectedTaxType}
                      />
                      {taxData?.map((item) => (
                        <TableItem
                          key={item.id}
                          onItemClick={() => handleOpenPanel(item)}
                          item={item}
                          onToggle={() => toggleOne(item.id)}
                          isChecked={isChecked(item.id)}
                          onOpenLinkProjectModal={handleOpenLinkProjectModal}
                          taxType={selectedTaxType}
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
            </>
          )}
        </div>
      </div>

      {/* 매출채권채무 디테일 판넬 */}
      {isPanelOpen && selectedItem && (
        <AccountsPanel
          onClose={handleClosePanel}
          itemId={selectedItem.id}
          type="tax"
        />
      )}

      {/* 프로젝트 연결 모달 */}
      {isLinkProjectModalOpen && selectedTaxIdForLink && (
        <LinkProjectModal
          taxId={selectedTaxIdForLink}
          onClose={handleCloseLinkProjectModal}
          onSuccess={handleLinkProjectSuccess}
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
