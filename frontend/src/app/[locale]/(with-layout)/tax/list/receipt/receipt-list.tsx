'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { createPortal } from 'react-dom';
import { SearchInput, Spinner, EmptySpace, MiniBtn } from '@/ui';
import TableItem from './table-item';
import Pagination from '@/components/pagination';
import {
  useGetPublishedDocuments,
  useCheckAll,
  useUpdateCashReceipt,
} from '@/hooks';
import { PublishedDocumentOutModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import AccountsPanel from '../accounts-panel';
import TableHeader from '../table-header';
import AccountStatusDropdown from '../account-status-dropdown';
import { useTranslations } from 'next-intl';

interface ReceiptListProps {
  className?: string;
}

const ReceiptList = ({ className = '' }: ReceiptListProps) => {
  // const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] =
    useState<PublishedDocumentOutModel | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false); // 패널 열기/닫기 상태 관리
  const [showHidden, setShowHidden] = useState(false);
  const [isHideRestoreLoading, setIsHideRestoreLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<string | undefined>(
    undefined
  );
  const [isAccountStatusDropdownOpen, setIsAccountStatusDropdownOpen] =
    useState(false);
  const [accountStatusDropdownRect, setAccountStatusDropdownRect] =
    useState<DOMRect | null>(null);

  // 공장 ID 가져오기
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const t = useTranslations('tax.list.receipt');
  const tList = useTranslations('tax.list');
  const tCommon = useTranslations('common');

  // useUpdateCashReceipt hook
  const { mutateAsync: updateCashReceipt } = useUpdateCashReceipt();

  // 디바운싱된 검색어 (300ms 지연)
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const itemsPerPage = 10;

  // useQuery 파라미터 구성
  const queryParams = useMemo(
    () => ({
      filters: {
        document_type: 'cash-receipt' as const,
        q: debouncedSearchQuery || undefined,
        is_hidden: showHidden,
        account_status: accountStatus,
      },
      page: currentPage,
      page_size: itemsPerPage,
    }),
    [debouncedSearchQuery, currentPage, itemsPerPage, showHidden, accountStatus]
  );

  // 현금영수증 데이터 조회 (useQuery 사용)
  const {
    data: cashReceiptData,
    isLoading,
    isFetching,
  } = useGetPublishedDocuments(queryParams, {
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

  // accountStatus 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
    setAllCheckedRef.current(false);
  }, [accountStatus]);

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
  const handleItemClick = (item: PublishedDocumentOutModel) => {
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
      alert(t('errors.hideRestoreFailed'));
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
              placeholder={tList('searchPlaceholder')}
            />
            {/* 숨김 버튼: 숨김 목록 보기 중이거나, 일반 목록에서 데이터가 있을 때 */}
            {role && !['viewer', 'prod_manager'].includes(role) && (
              <div className="flex gap-1">
                <MiniBtn
                  text={
                    checkedCount === 0
                      ? tList('buttons.showHidden')
                      : tCommon('cancel')
                  }
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
                        ? tList('buttons.restore')
                        : tList('buttons.hide')
                      : checkedCount === cashReceipts.length
                        ? showHidden
                          ? tList('buttons.restoreAll')
                          : tList('buttons.hideAll')
                        : showHidden
                          ? tList('buttons.restoreItems', {
                              count: checkedCount,
                            })
                          : tList('buttons.hideItems', { count: checkedCount })
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
            {cashReceipts.length === 0 && !accountStatus ? (
              <EmptySpace
                title={
                  showHidden
                    ? t('empty.hiddenTitle')
                    : t('empty.noReceiptsTitle')
                }
                description={
                  showHidden
                    ? t('empty.hiddenDescription')
                    : t('empty.noReceiptsDescription')
                }
                height="h-50"
                className="mt-2"
              />
            ) : (
              <>
                <div className="w-full overflow-x-auto overflow-y-hidden">
                  <TableHeader
                    checkedCount={checkedCount}
                    onToggleAll={toggleAll}
                    onSortClick={() => {}}
                    sortDirection="desc"
                    isAllChecked={isAllChecked}
                    taxType={null}
                    selectedAccountStatus={accountStatus}
                    onAccountStatusClick={(e) => {
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      setAccountStatusDropdownRect(rect);
                      setIsAccountStatusDropdownOpen(true);
                    }}
                    hasItems={cashReceipts.length > 0}
                  />
                  {cashReceipts.length === 0 ? (
                    <div className="flex h-14 items-center px-3 w-full min-w-[1192px] border-b border-lg Me_Body-1 text-dg">
                      <p className="text-gr w-full">
                        {t('empty.noStatusReceipts')}
                      </p>
                    </div>
                  ) : (
                    cashReceipts
                      .filter((item) => item.document_type === 'cash-receipt')
                      .map((item: PublishedDocumentOutModel) => (
                        <TableItem
                          key={item.id}
                          item={item}
                          onClick={() => handleItemClick(item)}
                          onToggle={() => toggleOne(item.id)}
                          isChecked={isChecked(item.id)}
                        />
                      ))
                  )}
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

        {/* 채무 상태 드롭다운 */}
        {isAccountStatusDropdownOpen &&
          accountStatusDropdownRect &&
          createPortal(
            <div
              style={{
                position: 'fixed',
                left: accountStatusDropdownRect.left + window.scrollX,
                top: accountStatusDropdownRect.bottom + window.scrollY + 8,
                zIndex: 1000,
                width: accountStatusDropdownRect.width,
              }}
            >
              <AccountStatusDropdown
                onClose={() => {
                  setIsAccountStatusDropdownOpen(false);
                  setAccountStatusDropdownRect(null);
                }}
                onSelect={(status) => {
                  setAccountStatus(status);
                  setCurrentPage(1); // 필터 변경 시 페이지 1로 리셋
                  setIsAccountStatusDropdownOpen(false);
                  setAccountStatusDropdownRect(null);
                }}
                width="w-full"
              />
            </div>,
            document.body
          )}
      </div>
    </>
  );
};

export default ReceiptList;
