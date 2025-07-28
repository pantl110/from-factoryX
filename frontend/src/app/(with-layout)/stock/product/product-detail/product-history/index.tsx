import { CalendarCheck, CaretDown } from '@phosphor-icons/react';
import ProductStockLogDropdown from '../../../../../../ui/dropdown/select-period-dropdown';
import { useState } from 'react';
import MiniBtn from '@/ui/mini-btn';
import NoHistoryBox from '@/ui/no-history-box';
import ProductStockLog from './product-stock-log';
import { useProductHistory, usePeriodSelector } from '@/hooks';
import { ProductHistoryListResponseModel } from '@/types/data-model';

interface ProductHistoryProps {
  productId: number | null;
}

const PAGE_SIZE = 8;

const ProductHistory = ({ productId }: ProductHistoryProps) => {
  const [isProductStockLogDropdownOpen, setIsProductStockLogDropdownOpen] =
    useState(false); // 판넬의 품목 입·출고 내역 드롭다운

  const { listProductHistories, data } = useProductHistory();

  const listData = data as ProductHistoryListResponseModel | undefined;
  const page = listData?.curPage ?? 1;
  const totalPages = listData?.pageCnt ?? 1;
  const histories = listData?.data ?? [];

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage !== page && productId !== null) {
      const filters = periodSelector.createFilters(
        periodSelector.selectedPeriod,
        newPage
      );
      listProductHistories(filters);
    }
  };

  // 기간 변경 핸들러
  const handlePeriodChange = (filters: Record<string, unknown>) => {
    listProductHistories(filters);
  };

  // 기간 선택 훅 사용
  const periodSelector = usePeriodSelector({
    onPeriodChange: handlePeriodChange,
    productId,
    page,
    pageSize: PAGE_SIZE,
  });

  const handleDropdownSelect = (value: string) => {
    periodSelector.handlePeriodChange(
      value as '1개월' | '3개월' | '6개월' | '1년' | '직접 설정'
    );
    setIsProductStockLogDropdownOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="h-10 flex items-center gap-2">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            품목 입·출고 내역
          </h3>

          {/* 기간 선택 */}
          {productId !== null ||
            (histories.length > 0 && (
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
            ))}

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
                    periodSelector.setCustomStartDate
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
                    periodSelector.setCustomEndDate
                  )
                }
                maxLength={10}
                size={(periodSelector.customEndDate || 'YYYY-MM-DDDD').length}
                onKeyDown={periodSelector.handleCustomDateKeyDown}
              />
            </div>
          )}
        </div>

        {/* 재고 이력 목록 */}
        {productId === null || histories.length === 0 ? (
          <NoHistoryBox
            title="아직 등록된 재고 이력이 없어요."
            text="입고나 출고와 관련된 재고 이력이 등록되면 이곳에서 확인할 수 있어요."
          />
        ) : (
          <ProductStockLog
            data={histories}
            page={page}
            totalPages={totalPages}
            setPage={handlePageChange}
          />
        )}
      </div>
    </>
  );
};

export default ProductHistory;
