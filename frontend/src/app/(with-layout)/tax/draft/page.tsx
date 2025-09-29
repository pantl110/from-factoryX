'use client';

import { useState, useEffect } from 'react';
import MainTitleSec from './main-title-sec';
import Checkbox from '@/ui/checkbox';
import { CaretUpDownIcon } from '@phosphor-icons/react';
import { useCheckAll } from '@/hooks/use-check-all';
import SearchDeleteTable from '@/ui/search-delete-table';
import DeleteModal from '@/ui/modal/delete-modal';
import TaxDetailPanel from '../tax-detail-panel';
import Pagination from '@/components/pagination';
import {
  useGetPendingTaxInvoices,
  useDeleteTaxInvoice,
  useCancelTaxInvoice,
} from '@/hooks';
import { PendingTaxInvoiceListResponseModel } from '@/types/data-model';
import Spinner from '@/ui/spinner';
import NoHistoryBox from '@/ui/no-history-box';
import TableItem from './table-item';
import NotAllowed from '../not-allowed';
import useSubscriptionStore from '@/store/subscription-store';

const TaxDraftPage = () => {
  // 구독 상태 확인
  const { isPartnersSubscription } = useSubscriptionStore();

  const [selectedTab, setSelectedTab] = useState<
    '전체' | '임시 저장' | '전송 대기'
  >('전체');

  const [isTaxDetailPanelOpen, setIsTaxDetailPanelOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // 정렬 상태 관리
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // API 훅 사용
  const { getPendingTaxInvoices, isLoading: isDataLoading } =
    useGetPendingTaxInvoices();
  const { deleteTaxInvoice, isLoading: isDeleteLoading } =
    useDeleteTaxInvoice();
  const { cancelTaxInvoice, isLoading: isCancelLoading } =
    useCancelTaxInvoice();

  // 데이터 상태 관리
  const [taxInvoices, setTaxInvoices] =
    useState<PendingTaxInvoiceListResponseModel | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      const result = await getPendingTaxInvoices({
        page: currentPage,
        page_size: 10,
        q: searchQuery || undefined,
        ordering:
          sortOrder === 'desc' ? '-transaction_date' : 'transaction_date',
        publish_status:
          selectedTab === '전체'
            ? 'all'
            : selectedTab === '임시 저장'
              ? 'temporary'
              : 'pending',
      });

      if (result.success && result.data) {
        setTaxInvoices(result.data);
      }
    };

    fetchData();
  }, [getPendingTaxInvoices, currentPage, searchQuery, selectedTab, sortOrder]);

  // useCheckAll 훅 사용 (현재 페이지 데이터 기준)
  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(taxInvoices?.data.map((item) => item.id) || []);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handlePanelClose = () => {
    setIsTaxDetailPanelOpen(false);
    setSelectedItemId(null);
  };

  // 선택된 세금계산서 삭제 처리
  const handleDelete = async () => {
    const selectedItems =
      taxInvoices?.data.filter((item) => isChecked(item.id)) || [];

    if (selectedItems.length === 0) return;

    try {
      // 상태별로 분류
      const pendingItems = selectedItems.filter(
        (item) =>
          item.barobill_state === '발급완료' && item.nts_send_state === '전송전'
      );
      const temporaryItems = selectedItems.filter(
        (item) => item.barobill_state === '임시저장'
      );

      const results = [];

      // 전송대기 상태인 세금계산서는 발행 취소 후 삭제
      if (pendingItems.length > 0) {
        // 1단계: 발행 취소
        const cancelPromises = pendingItems.map((item) =>
          cancelTaxInvoice(item.id)
        );
        const cancelResults = await Promise.all(cancelPromises);

        // 발행 취소가 성공한 항목들만 삭제 진행
        const successfulCancelledItems = pendingItems.filter(
          (_, index) => cancelResults[index].success
        );

        if (successfulCancelledItems.length > 0) {
          // 2단계: 발행 취소 성공한 항목들 삭제
          const deletePromises = successfulCancelledItems.map((item) =>
            deleteTaxInvoice(item.id)
          );
          const deleteResults = await Promise.all(deletePromises);
          results.push(...deleteResults);
        }

        // 발행 취소 실패한 항목들도 결과에 추가
        const failedCancelledItems = cancelResults.filter(
          (result) => !result.success
        );
        results.push(...failedCancelledItems);
      }

      // 임시저장 상태인 세금계산서는 삭제만
      if (temporaryItems.length > 0) {
        const deletePromises = temporaryItems.map((item) =>
          deleteTaxInvoice(item.id)
        );
        const deleteResults = await Promise.all(deletePromises);
        results.push(...deleteResults);
      }

      // 모든 처리가 성공했는지 확인
      const isAllSuccess = results.every((result) => result.success);

      if (isAllSuccess) {
        // 성공 시 체크박스 초기화하고 데이터 새로고침
        setAllChecked(false);
        setIsDeleteModalOpen(false);

        // 데이터 새로고침
        const result = await getPendingTaxInvoices({
          page: currentPage,
          page_size: 10,
          q: searchQuery || undefined,
          ordering:
            sortOrder === 'desc' ? '-transaction_date' : 'transaction_date',
          publish_status:
            selectedTab === '전체'
              ? 'all'
              : selectedTab === '임시 저장'
                ? 'temporary'
                : 'pending',
        });

        if (result.success && result.data) {
          setTaxInvoices(result.data);
        }
      } else {
        // 일부 처리 실패 시 에러 처리
        const failedResults = results.filter((result) => !result.success);
        alert(
          `일부 세금계산서 처리에 실패했습니다. ${failedResults.map(
            (result) => result.error
          )}`
        );
      }
    } catch {
      alert('세금계산서 처리 중 오류가 발생했습니다.');
    }
  };

  // 발행일자 정렬 핸들러
  const handleDateSort = () => {
    if (sortOrder === 'desc') {
      setSortOrder('asc');
    } else {
      setSortOrder('desc');
    }
    // 정렬 변경 시 첫 페이지로 이동
    setCurrentPage(1);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 체크박스 초기화
    setAllChecked(false);
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: '전체' | '임시 저장' | '전송 대기') => {
    setSelectedTab(tab);
    // 탭 변경 시 첫 페이지로 이동, 체크박스 초기화, 검색어 초기화
    setCurrentPage(1);
    setAllChecked(false);
    setSearchQuery('');
  };

  // PARTNERS 구독이 아니면 접근 차단
  if (!isPartnersSubscription()) {
    return <NotAllowed />;
  }

  return (
    <>
      <div className={`flex flex-col gap-8`}>
        <MainTitleSec
          selectedTab={selectedTab}
          setSelectedTab={handleTabChange}
        />
        <div className="px-10 pb-10">
          <SearchDeleteTable
            checkedCount={checkedCount}
            deleteButtonText={getDeleteButtonText()}
            onDelete={() => setIsDeleteModalOpen(true)}
            onCancel={() => setAllChecked(false)}
            onSearch={(query) => {
              setSearchQuery(query);
              setCurrentPage(1); // 검색 시 첫 페이지로 이동
            }}
            searchKeyword={searchQuery}
            hasData={!!taxInvoices?.data.length}
          />

          {isDataLoading ? (
            <div className="flex justify-center items-center h-100">
              <Spinner />
            </div>
          ) : !taxInvoices || taxInvoices?.data.length === 0 ? (
            <NoHistoryBox
              title={
                selectedTab === '전체'
                  ? '임시 저장 또는 전송 대기 중인 세금계산서가 없어요.'
                  : selectedTab === '임시 저장'
                    ? '아직 임시 저장된 세금계산서가 없어요.'
                    : '아직 전송 대기 중인 세금계산서가 없어요.'
              }
              text="세금계산서를 생성하면 이곳에서 확인하실 수 있어요."
            />
          ) : (
            <>
              <div className="w-full overflow-y-auto">
                <div className="flex items-center h-12 min-w-[1272px] border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
                  <Checkbox isChecked={isAllChecked} onToggle={toggleAll} />
                  <p className="px-3 w-[150px]">진행상태</p>
                  <p className="px-3 flex-2">구분</p>
                  <p className="px-3 flex-2">업체명</p>
                  <p className="px-3 w-[200px]">공급가액</p>
                  <p className="px-3 w-[200px]">세액</p>
                  <p className="px-3 w-[200px]">합계금액</p>
                  <div
                    className="px-3 w-[200px] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
                    onClick={handleDateSort}
                  >
                    <p className="">발행일자</p>
                    <CaretUpDownIcon size={21} className="text-sv" />
                  </div>
                </div>
                {taxInvoices?.data.map((item) => (
                  <TableItem
                    key={item.id}
                    item={item}
                    isChecked={isChecked(item.id)}
                    onToggle={() => toggleOne(item.id)}
                    onItemClick={() => {
                      setSelectedItemId(item.id);
                      setIsTaxDetailPanelOpen(true);
                    }}
                  />
                ))}
              </div>
              {(taxInvoices?.pageCnt || 0) > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={taxInvoices?.pageCnt || 1}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* 모달, 판넬, 토스트 */}
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDelete}
          isLoading={isDeleteLoading || isCancelLoading}
        />
      )}
      {isTaxDetailPanelOpen && selectedItemId && (
        <TaxDetailPanel onClose={handlePanelClose} itemId={selectedItemId} />
      )}
    </>
  );
};

export default TaxDraftPage;
