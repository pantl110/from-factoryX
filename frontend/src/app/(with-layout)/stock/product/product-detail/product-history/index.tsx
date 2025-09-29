import { useEffect } from 'react';
import NoHistoryBox from '@/ui/no-history-box';
import { useProductHistory, useTooltip } from '@/hooks';
import { ProductHistoryListResponseModel } from '@/types/data-model';
import ProductStockLog from './product-stock-log';
import { Info } from '@phosphor-icons/react';
import Tooltip from '@/ui/tooltip';

interface ProductHistoryProps {
  productId: number | null;
  setIsProjectStockHistoryModalOpen: (modal: {
    isOpen: boolean;
    projectId?: number;
  }) => void;
}

const PAGE_SIZE = 8;

const ProductHistory = ({
  productId,
  setIsProjectStockHistoryModalOpen,
}: ProductHistoryProps) => {
  // const [isProductStockLogDropdownOpen, setIsProductStockLogDropdownOpen] =
  //   useState(false); // 판넬의 품목 입·출고 내역 드롭다운

  const { listProductHistories, data } = useProductHistory();
  const { isVisible, onMouseEnter, onMouseLeave } = useTooltip({});

  const listData = data as ProductHistoryListResponseModel | undefined;
  const page = listData?.curPage ?? 1;
  const totalPages = listData?.pageCnt ?? 1;
  const histories = listData?.data ?? [];

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage !== page && productId !== null) {
      // const filters = periodSelector.createFilters(
      //   periodSelector.selectedPeriod,
      //   newPage
      // );
      // listProductHistories(filters);

      listProductHistories({
        product_id: productId,
        page: newPage,
        page_size: PAGE_SIZE,
      });
    }
  };

  // 초기 로드 및 제품 변경 시 첫 페이지 조회
  useEffect(() => {
    if (productId !== null) {
      listProductHistories({
        product_id: productId,
        page: 1,
        page_size: PAGE_SIZE,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // // 기간 변경 핸들러
  // const handlePeriodChange = (filters: Record<string, unknown>) => {
  //   listProductHistories(filters);
  // };

  // // 기간 선택 훅 사용
  // const periodSelector = usePeriodSelector({
  //   onPeriodChange: handlePeriodChange,
  //   productId,
  //   page,
  //   pageSize: PAGE_SIZE,
  // });

  // const handleDropdownSelect = (value: string) => {
  //   periodSelector.handlePeriodChange(
  //     value as '1개월' | '3개월' | '6개월' | '1년' | '직접 설정'
  //   );
  //   setIsProductStockLogDropdownOpen(false);
  // };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="h-10 flex items-center gap-2">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            재고 변동 내역
          </h3>
          <div
            className="relative"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <Info size={20} className="text-gr cursor-help" />
            {isVisible && (
              <div className="absolute z-10 top-7 -left-2 w-140">
                <Tooltip
                  text="현재 재고의 영향이 없을 때는 반품으로 인해 이전 출고 내역을 취소한 처리입니다."
                  color="black"
                  position="left"
                />
              </div>
            )}
          </div>

          {/* 기간 선택 */}
          {/* {productId !== null && (
            <div className="relative">
              <MiniBtn
                text={periodSelector.selectedPeriod}
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                icon={CaretDown}
                iconPosition="right"
                onClick={() => setIsProductStockLogDropdownOpen(true)}
                height="h-9"
              />
              {isProductStockLogDropdownOpen && (
                <div className="absolute top-12 right-0 z-10 pb-5">
                  <ProductStockLogDropdown
                    onClose={() => setIsProductStockLogDropdownOpen(false)}
                    onSelect={handleDropdownSelect}
                  />
                </div>
              )}
            </div>
          )} 

          {periodSelector.selectedPeriod === '직접 설정' && (
            <div className="flex items-center px-3 h-9 gap-2 border border-lg rounded-lg">
              <CalendarCheck size={20} className="text-dg" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                className="Me_Body-1 text-dg border-none outline-none focus:outline-none w-fit"
                value={periodSelector.customStartDate}
                onChange={(e) =>
                  periodSelector.handleDateAutoHyphen(
                    e.target.value,
                    periodSelector.handleStartDateChange
                  )
                }
                maxLength={10}
                size={(periodSelector.customStartDate || 'YYYY-MM-DDDD').length}
                onKeyDown={periodSelector.handleCustomDateKeyDown}
              />
              <span className="mx-0">~</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                className="Me_Body-1 text-dg border-none outline-none focus:outline-none w-fit"
                value={periodSelector.customEndDate}
                onChange={(e) =>
                  periodSelector.handleDateAutoHyphen(
                    e.target.value,
                    periodSelector.handleEndDateChange
                  )
                }
                maxLength={10}
                size={(periodSelector.customEndDate || 'YYYY-MM-DDDD').length}
                onKeyDown={periodSelector.handleCustomDateKeyDown}
              />
            </div>
          )} */}
        </div>

        {/* 재고 이력 목록 */}
        {productId === null || histories.length === 0 ? (
          <NoHistoryBox
            title="등록된 재고 이력이 아직 없어요."
            text="입고나 출고와 관련된 재고 이력이 등록되면 이곳에서 확인할 수 있어요."
          />
        ) : (
          <ProductStockLog
            data={histories}
            page={page}
            totalPages={totalPages}
            setPage={handlePageChange}
            setIsProjectStockHistoryModalOpen={
              setIsProjectStockHistoryModalOpen
            }
          />
        )}
      </div>
    </>
  );
};

export default ProductHistory;
