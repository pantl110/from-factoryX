import { CalendarCheck, CaretDown } from '@phosphor-icons/react';
import ProductStockLogDropdown from '../../modals/product-stock-log-dropdown';
import { useState, useEffect, useRef } from 'react';
import MiniBtn from '@/ui/mini-btn';
import NoHistoryBox from '@/ui/no-history-box';
import ProductStockLog from './product-stock-log';
import { useProductHistory } from '@/hooks';
import { ProductHistoryListResponseModel } from '@/types/data-model';

interface ProductHistoryProps {
  productId: number | null;
}

const PAGE_SIZE = 8;

const getPeriodRange = (period: string) => {
  const today = new Date();
  let startDate = '';
  const endDate = today.toISOString().slice(0, 10);
  if (period === '1개월') {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    startDate = d.toISOString().slice(0, 10);
  } else if (period === '3개월') {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 3);
    startDate = d.toISOString().slice(0, 10);
  } else if (period === '6개월') {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 6);
    startDate = d.toISOString().slice(0, 10);
  } else if (period === '1년') {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 1);
    startDate = d.toISOString().slice(0, 10);
  }
  return { startDate, endDate };
};

const ProductHistory = ({ productId }: ProductHistoryProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('1개월');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isProductStockLogDropdownOpen, setIsProductStockLogDropdownOpen] =
    useState(false); // 판넬의 품목 입·출고 내역 드롭다운
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { listProductHistories, data } = useProductHistory();

  const listData = data as ProductHistoryListResponseModel | undefined;
  const page = listData?.curPage ?? 1;
  const totalPages = listData?.pageCnt ?? 1;
  const histories = listData?.data ?? [];

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage !== page && productId !== null) {
      listProductHistories({
        ...(selectedPeriod === '직접 설정' && customStartDate && customEndDate
          ? {
              product: productId,
              page: newPage,
              page_size: PAGE_SIZE,
              start_date: customStartDate,
              end_date: customEndDate,
            }
          : {
              product: productId,
              page: newPage,
              page_size: PAGE_SIZE,
              ...(() => {
                const { startDate, endDate } = getPeriodRange(selectedPeriod);
                return startDate && endDate
                  ? { start_date: startDate, end_date: endDate }
                  : {};
              })(),
            }),
      });
    }
  };

  // 일반 기간(1,3,6개월,1년) 검색
  useEffect(() => {
    if (!productId) return;
    if (selectedPeriod === '직접 설정') return;
    const filters: Record<string, unknown> = {
      product: productId,
      page,
      page_size: PAGE_SIZE,
    };
    const { startDate, endDate } = getPeriodRange(selectedPeriod);
    if (startDate && endDate) {
      filters.start_date = startDate;
      filters.end_date = endDate;
    }
    listProductHistories(filters);
  }, [productId, page, selectedPeriod, listProductHistories]);

  // 직접 설정: 입력 후 0.5초 디바운스
  useEffect(() => {
    if (selectedPeriod !== '직접 설정') return;
    if (!productId) return;
    if (!customStartDate || !customEndDate) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      listProductHistories({
        // product: productId,
        page,
        page_size: PAGE_SIZE,
        start_date: customStartDate,
        end_date: customEndDate,
      });
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    customStartDate,
    customEndDate,
    selectedPeriod,
    productId,
    page,
    listProductHistories,
  ]);

  const handleDropdownSelect = (value: string) => {
    setSelectedPeriod(value);
    setIsProductStockLogDropdownOpen(false);
    handlePageChange(1);
  };

  const handleDateAutoHyphen = (value: string, setter: (v: string) => void) => {
    const digits = value.replace(/[^0-9]/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4)
      formatted = digits.slice(0, 4) + '-' + digits.slice(4);
    if (digits.length > 6)
      formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
    setter(formatted);
  };

  // 직접 설정: 엔터로 검색
  const handleCustomDateKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter' && customStartDate && customEndDate && productId) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      listProductHistories({
        // product: productId,
        page,
        page_size: PAGE_SIZE,
        start_date: customStartDate,
        end_date: customEndDate,
      });
    }
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
                  text={selectedPeriod}
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

          {selectedPeriod === '직접 설정' && (
            <div className="flex items-center px-3 h-9 gap-2 border border-lg rounded-lg">
              <CalendarCheck size={20} className="text-dg" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                className="Me_Body-1 text-dg border-none outline-none focus:outline-none w-fit"
                value={customStartDate}
                onChange={(e) =>
                  handleDateAutoHyphen(e.target.value, setCustomStartDate)
                }
                maxLength={10}
                size={(customStartDate || 'YYYY-MM-DDDD').length}
                onKeyDown={handleCustomDateKeyDown}
              />
              <span className="mx-0">~</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                className="Me_Body-1 text-dg border-none outline-none focus:outline-none w-fit"
                value={customEndDate}
                onChange={(e) =>
                  handleDateAutoHyphen(e.target.value, setCustomEndDate)
                }
                maxLength={10}
                size={(customEndDate || 'YYYY-MM-DDDD').length}
                onKeyDown={handleCustomDateKeyDown}
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
