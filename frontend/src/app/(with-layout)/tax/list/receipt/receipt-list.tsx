'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { SearchInput, Spinner, EmptySpace, MiniBtn } from '@/ui';
import TableItem from './table-item';
import Pagination from '@/components/pagination';
import { useGetCashReceipts, useCheckAll, useUpdateCashReceipt } from '@/hooks';
import { CashReceiptResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import AccountsPanel from '../accounts-panel';
import Checkbox from '@/ui/checkbox';

interface ReceiptListProps {
  className?: string;
}

const ReceiptList = ({ className = '' }: ReceiptListProps) => {
  // const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] =
    useState<CashReceiptResponseModel | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false); // 패널 열기/닫기 상태 관리
  const [showHidden, setShowHidden] = useState(false);
  const [isHideRestoreLoading, setIsHideRestoreLoading] = useState(false);

  // 공장 ID 가져오기
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const isProdManager = role === 'prod_manager';

  // useUpdateCashReceipt hook
  const { mutateAsync: updateCashReceipt } = useUpdateCashReceipt();

  // 디바운싱된 검색어 (300ms 지연)
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const itemsPerPage = 10;

  // useQuery 파라미터 구성
  const queryParams = useMemo(
    () => ({
      q: debouncedSearchQuery || undefined,
      page: currentPage,
      page_size: itemsPerPage,
      is_hidden: showHidden,
    }),
    [debouncedSearchQuery, currentPage, itemsPerPage, showHidden]
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

  // useCheckAll hook 사용
  const itemIds = useMemo(
    () => cashReceipts.map((item) => item.id),
    [cashReceipts]
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

  // showHidden 상태 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
    setAllCheckedRef.current(false);
  }, [showHidden]);

  // 거래일자 정렬 핸들러
  // const handleDateSort = () => {
  //   setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  //   setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  // };

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

  // 숨긴 목록 보기 토글 핸들러
  const handleToggleHidden = () => {
    if (checkedCount > 0) {
      // 체크된 항목이 있으면 취소 (체크박스 리셋)
      setAllChecked(false);
      return;
    }
    setShowHidden(!showHidden);
    setCurrentPage(1);
    setAllChecked(false);
  };

  // 숨기기/복구 핸들러
  const handleHideRestore = async () => {
    const checkedIds = cashReceipts
      .filter((item) => isChecked(item.id))
      .map((item) => item.id);

    if (checkedIds.length === 0) return;

    setIsHideRestoreLoading(true);

    try {
      // 체크된 모든 현금영수증의 숨김 상태를 변경
      const updatePromises = checkedIds.map((receiptId) =>
        updateCashReceipt({
          cashReceiptId: receiptId,
          payload: {
            is_hidden: !showHidden, // 현재 상태와 반대로 변경
          },
        })
      );

      // 모든 업데이트 요청을 병렬로 처리
      await Promise.all(updatePromises);

      // 성공적으로 업데이트된 경우 체크박스 상태 리셋
      setAllChecked(false);
      setSearchQuery('');
    } catch {
      alert('현금영수증 숨김/복구에 실패했습니다.');
    } finally {
      setIsHideRestoreLoading(false);
    }
  };

  return (
    <>
      <div className={className}>
        <div className="pb-4">
          <div className="flex items-center justify-between">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="현금영수증의 업체명을 입력하세요."
            />
            {/* 숨김 버튼: 숨김 목록 보기 중이거나, 일반 목록에서 데이터가 있을 때 */}
            {role && !['viewer', 'prod_manager'].includes(role) && (
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
                      : checkedCount === cashReceipts.length
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
        </div>

        {isLoading || isFetching ? (
          <div className="flex justify-center items-center h-100">
            <Spinner />
          </div>
        ) : (
          <div className="pb-10">
            {cashReceipts.length === 0 ? (
              <EmptySpace
                title={
                  showHidden
                    ? '아직 숨긴 현금영수증이 없어요.'
                    : '아직 발급된 현금영수증이 없어요.'
                }
                description={
                  showHidden
                    ? '표시하지 않을 현금영수증을 숨기면 이곳에서 다시 볼 수 있어요.'
                    : '발급 후 이곳에서 내역을 확인하실 수 있어요.'
                }
                height="h-50"
                className="mt-2"
              />
            ) : (
              <>
                <div className="w-full overflow-x-auto">
                  <div className="text-sv flex items-center w-full min-w-[1192px] h-12 border-t border-b border-lg Me_Body-1">
                    <Checkbox
                      isChecked={isAllChecked}
                      onToggle={toggleAll}
                      disabled={isProdManager || isViewer}
                    />
                    <p className="flex-1 px-3">채권 상태</p>
                    <p className="flex-[1.5] px-3">업체명</p>
                    <p className="flex-[1.5] px-3">제품명</p>
                    <p className="flex-[1.5] px-3">청구금액(합계)</p>
                    <p className="flex-[1.5] px-3">미지급금액(잔액)</p>
                    <p className="flex-[1.5] px-3">발주서 연결</p>
                  </div>

                  {cashReceipts.map((item: CashReceiptResponseModel) => (
                    <TableItem
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item)}
                      onToggle={() => toggleOne(item.id)}
                      isChecked={isChecked(item.id)}
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
