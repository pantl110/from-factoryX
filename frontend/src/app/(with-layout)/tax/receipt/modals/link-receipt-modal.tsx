import { useEffect, useState } from 'react';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import PriceInfoSection from './price-info-section';
import SelectedItem from './selected-item';
import { useGetMaterialHistory } from '@/hooks';
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
  const [searchKeyword, setSearchKeyword] = useState('');
  const [unlinkedMaterialHistory, setUnlinkedMaterialHistory] = useState<
    MaterialHistoryResponseModel[]
  >([]);
  const [unlinkedPage, setUnlinkedPage] = useState(1);
  const [unlinkedHasMore, setUnlinkedHasMore] = useState(true);
  const [linkedMaterialHistory, setLinkedMaterialHistory] = useState<
    MaterialHistoryResponseModel[]
  >([]);
  const { getMaterialHistory, isLoading, error } = useGetMaterialHistory();

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
        setUnlinkedHasMore(hasMore);
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
            setLinkedMaterialHistory(newResult.data.data);
          }
        } else {
          setLinkedMaterialHistory(result.data.data);
        }
      }
    };
    fetchUnlinkedData();
    fetchLinkedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword, receiptId]);

  const handleLoadMoreUnlinked = async () => {
    if (!unlinkedHasMore) return;

    const nextPage = unlinkedPage + 1;

    const result = await getMaterialHistory({
      material_name: searchKeyword || undefined,
      page: nextPage,
      page_size: 9,
      is_linked: false,
    });

    if (result.success && result.data) {
      // 기존 데이터에 새 페이지 데이터 추가
      setUnlinkedMaterialHistory((prev) => [...prev, ...result.data.data]);

      // 페이지 번호 업데이트
      setUnlinkedPage(nextPage);

      // 더 가져올 데이터가 있는지 확인 // nextPage가 있으면 더 가져올 데이터가 있는 것
      const hasMore = !!result.data.nextPage;
      setUnlinkedHasMore(hasMore);
    }
  };

  return (
    <Modal
      width="w-[1000px]"
      title="현금영수증에 구매 내역을 연결해주세요."
      subtitle="영수증에는 자재명이 따로 안 보여요. 자재를 직접 연결하면 추적과 단가를 정확히 관리할 수 있어요."
      onClose={onClose}
      scroll={true}
    >
      <div className="flex flex-col gap-4 mt-4 px-6">
        <PriceInfoSection supplyAmount={supplyAmount} taxAmount={taxAmount} />

        <div className="border-t border-lg" />

        <div
          className={`flex flex-col gap-2 overflow-y-auto pb-6 scrollbar-hide max-h-[calc(85vh-256.8px)]`}
        >
          <div className="flex gap-2.5">
            {/* 왼쪽 영역 */}
            <div className="flex-2 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <SearchInput
                  placeholder="연결할 내역에 대한 원자재를 검색하세요."
                  onChange={(value) => setSearchKeyword(value)}
                />
                <MiniBtn
                  text="선택 항목 추가"
                  hoverColor="hover:bg-bg"
                  textColor="text-dg"
                  borderColor="border-lg"
                />
              </div>
              {unlinkedMaterialHistory.length > 0 ? (
                <UnlinkedTable
                  unlinkedMaterialHistory={unlinkedMaterialHistory}
                  onLoadMore={handleLoadMoreUnlinked}
                />
              ) : (
                <NoHistoryBox text="연결할 자재가 없어요." height="h-[496px]" />
              )}
            </div>

            {/* 오른쪽 영역 */}
            <div className="flex-1 flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <p className="Heading-5 text-dg">3개 선택</p>
                <MiniBtn
                  text="전체 삭제"
                  hoverColor="hover:bg-bg"
                  textColor="text-dg"
                  borderColor="border-lg"
                />
              </div>
              <div className="bg-bg rounded-[8px] p-3 w-full flex flex-col gap-2">
                <SelectedItem /> <SelectedItem /> <SelectedItem />
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className={`flex gap-2.5 pt-2 justify-end`}>
            <MiniBtn
              text="취소"
              hoverColor="hover:bg-bg"
              textColor="text-sv"
              onClick={onClose}
            />
            <div className="flex gap-2.5">
              <MiniBtn
                text="내역 연결"
                hoverColor="hover:bg-primary-hover"
                bgColor="bg-primary"
                textColor="text-wh"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LinkReceiptModal;
