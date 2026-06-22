import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import PriceInfoSection from './price-info-section';
import SelectedItem from './selected-item';
import { useGetMaterialHistory, useUpdateMaterialHistory } from '@/hooks';
import { MaterialHistoryResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import UnlinkedTable from './unlinked-table';

interface LinkTaxModalProps {
  onClose: () => void;
  supplyAmount: number;
  taxAmount: number;
  receiptId: number;
}

const LinkReceiptModal = ({
  onClose,
  supplyAmount,
  taxAmount,
  receiptId,
}: LinkTaxModalProps) => {
  const t = useTranslations('tax.list.receipt.linkReceiptModal');
  const tCommon = useTranslations('common');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [unlinkedMaterialHistory, setUnlinkedMaterialHistory] = useState<
    MaterialHistoryResponseModel[]
  >([]);
  const [unlinkedPage, setUnlinkedPage] = useState(1);
  const [hasMoreUnlinked, setHasMoreUnlinked] = useState(true);
  const [linkedMaterialHistory, setLinkedMaterialHistory] = useState<
    MaterialHistoryResponseModel[]
  >([]);
  const [selectedUnlinkedIds, setSelectedUnlinkedIds] = useState<number[]>([]);
  const { getMaterialHistory } = useGetMaterialHistory();
  const { updateMaterialHistory, isLoading: isUpdating } =
    useUpdateMaterialHistory();

  const selectedAmount = useMemo(() => {
    return linkedMaterialHistory.reduce(
      (sum, item) => sum + (item.amount ?? 0),
      0
    );
  }, [linkedMaterialHistory]);

  const differenceAmount = useMemo(() => {
    return supplyAmount + taxAmount - selectedAmount;
  }, [supplyAmount, taxAmount, selectedAmount]);

  // 초기 로드 및 검색어 변경 시 데이터 가져오기 (표시는 아직 하지 않음)
  useEffect(() => {
    const fetchUnlinkedData = async () => {
      const result = await getMaterialHistory({
        material_name: searchKeyword || undefined,
        page: 1,
        page_size: 9,
        is_linked: false,
      });
      if (result.success && result.data) {
        setUnlinkedMaterialHistory(result.data.data);
        setUnlinkedPage(1);
        // 첫 페이지에서 더 많은 데이터가 있는지 확인
        const hasMore = !!result.data.nextPage;
        setHasMoreUnlinked(hasMore);
      }
    };
    const fetchLinkedData = async () => {
      const result = await getMaterialHistory({
        receipt_id: receiptId,
        page: 1,
        page_size: 20,
      });
      if (result.success && result.data) {
        if (result.data.totalCnt > 20) {
          const newResult = await getMaterialHistory({
            receipt_id: receiptId,
            page: 1,
            page_size: result.data.totalCnt,
          });
          if (newResult.success && newResult.data) {
            setLinkedMaterialHistory(newResult.data.data || []);
          }
        } else {
          setLinkedMaterialHistory(result.data.data || []);
        }
      }
    };
    fetchUnlinkedData();
    fetchLinkedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword, receiptId]);

  const handleLoadMoreUnlinked = async () => {
    if (!hasMoreUnlinked) return;

    const nextPage = unlinkedPage + 1;

    const result = await getMaterialHistory({
      material_name: searchKeyword || undefined,
      page: nextPage,
      page_size: 9,
      is_linked: false,
    });

    if (result.success && result.data) {
      // 기존 데이터에 새 페이지 데이터 추가
      const { data: historyData, nextPage: resultNextPage } = result.data;
      if (historyData) {
        setUnlinkedMaterialHistory((prev) => [...prev, ...historyData]);
      }

      // 페이지 번호 업데이트
      setUnlinkedPage(nextPage);

      // 더 가져올 데이터가 있는지 확인 // nextPage가 있으면 더 가져올 데이터가 있는 것
      const hasMore = !!resultNextPage;
      setHasMoreUnlinked(hasMore);
    }
  };

  const toggleSelectUnlinked = (id: number) => {
    setSelectedUnlinkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllUnlinked = () => {
    if (selectedUnlinkedIds.length === unlinkedMaterialHistory.length) {
      setSelectedUnlinkedIds([]);
    } else {
      setSelectedUnlinkedIds(unlinkedMaterialHistory.map((item) => item.id));
    }
  };

  const handleAddSelected = async () => {
    if (selectedUnlinkedIds.length === 0) return;
    const selectedItems = unlinkedMaterialHistory.filter((item) =>
      selectedUnlinkedIds.includes(item.id)
    );
    // 오른쪽 리스트에 추가
    setLinkedMaterialHistory((prev) => [...prev, ...selectedItems]);
    // 왼쪽 리스트에서 제거
    setUnlinkedMaterialHistory((prev) =>
      prev.filter((item) => !selectedUnlinkedIds.includes(item.id))
    );
    // 선택 상태 초기화
    setSelectedUnlinkedIds([]);

    // 데이터가 부족하고 더 가져올 수 있다면 자동으로 로드
    const remainingItems = unlinkedMaterialHistory.filter(
      (item) => !selectedUnlinkedIds.includes(item.id)
    );
    if (remainingItems.length < 9 && hasMoreUnlinked) {
      await handleLoadMoreUnlinked();
    }
  };

  return (
    <Modal
      width="w-[1000px]"
      title={t('title')}
      subtitle={t('subtitle')}
      onClose={onClose}
      scroll={true}
    >
      <div className="flex flex-col gap-4 mt-4 px-6">
        <PriceInfoSection
          supplyAmount={supplyAmount}
          taxAmount={taxAmount}
          selectedAmount={selectedAmount}
          differenceAmount={differenceAmount}
        />

        <div className="border-t border-lg" />

        <div
          className={`flex flex-col gap-2 overflow-y-auto pb-6 scrollbar-hide max-h-[calc(85vh-341.17px)]`}
        >
          <div className="flex gap-2.5">
            {/* 왼쪽 영역 */}
            <div className="flex-2 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <SearchInput
                  placeholder={t('searchPlaceholder')}
                  onChange={(value) => setSearchKeyword(value)}
                />
                <MiniBtn variant="whiteOutline"
                  text={t('buttons.addSelected')}
                  disabled={selectedUnlinkedIds.length === 0}
                  onClick={handleAddSelected}
                />
              </div>
              {unlinkedMaterialHistory.length > 0 ? (
                <UnlinkedTable
                  unlinkedMaterialHistory={unlinkedMaterialHistory}
                  selectedIds={selectedUnlinkedIds}
                  onToggleSelect={toggleSelectUnlinked}
                  onToggleSelectAll={toggleSelectAllUnlinked}
                  onLoadMore={handleLoadMoreUnlinked}
                />
              ) : (
                <NoHistoryBox text={t('empty')} height="h-[496px]" />
              )}
            </div>

            {/* 오른쪽 영역 */}
            <div className="flex-1 flex flex-col gap-2.5">
              <div className="flex justify-between items-center h-12">
                <p className="Heading-5 text-dg">
                  {t('selectedCount', { count: linkedMaterialHistory.length })}
                </p>
                <MiniBtn variant="whiteOutline"
                  text={tCommon('deleteAll')}
                  onClick={async () => {
                    // 오른쪽 모든 항목을 다시 왼쪽으로 되돌림
                    setUnlinkedMaterialHistory((prev) => [
                      ...linkedMaterialHistory,
                      ...prev,
                    ]);
                    setLinkedMaterialHistory([]);

                    // 데이터가 충분하면 자동 로드하지 않음
                    const currentCount =
                      unlinkedMaterialHistory.length +
                      linkedMaterialHistory.length;
                    if (currentCount < 9 && hasMoreUnlinked) {
                      await handleLoadMoreUnlinked();
                    }
                  }}
                />
              </div>
              <div className="bg-bg rounded-[8px] p-3 w-full flex flex-col gap-2 h-[496px] overflow-y-auto scrollbar-hide">
                {linkedMaterialHistory.map((item) => (
                  <SelectedItem
                    key={item.id}
                    item={item}
                    onRemove={async (id) => {
                      // 해당 항목을 오른쪽에서 제거하고 왼쪽으로 되돌림
                      setLinkedMaterialHistory((prev) =>
                        prev.filter((x) => x.id !== id)
                      );
                      const removed = linkedMaterialHistory.find(
                        (x) => x.id === id
                      );
                      if (removed) {
                        setUnlinkedMaterialHistory((prev) => [
                          removed,
                          ...prev,
                        ]);

                        // 데이터가 충분하면 자동 로드하지 않음
                        const currentCount = unlinkedMaterialHistory.length + 1;
                        if (currentCount < 9 && hasMoreUnlinked) {
                          await handleLoadMoreUnlinked();
                        }
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className={`flex gap-2.5 pt-2 justify-end`}>
            <MiniBtn variant="white"
              text={tCommon('cancel')}
              onClick={onClose}
            />
            <div className="flex gap-2.5">
              <MiniBtn variant="primary"
                text={t('buttons.link')}
                disabled={isUpdating || differenceAmount !== 0}
                onClick={async () => {
                  const ids = linkedMaterialHistory.map((i) => i.id);
                  const res = await updateMaterialHistory(receiptId, ids);
                  if (res.success) {
                    onClose();
                  } else if (res.error) {
                    alert(res.error);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LinkReceiptModal;
