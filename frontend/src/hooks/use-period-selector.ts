import { useState, useEffect, useRef } from 'react';

export type PeriodType = '1개월' | '3개월' | '6개월' | '1년' | '직접 설정';

interface PeriodSelectorOptionsModel {
  onPeriodChange?: (filters: Record<string, unknown>) => void;
  productId?: number | null;
  page?: number;
  pageSize?: number;
}

export const usePeriodSelector = ({
  onPeriodChange,
  productId,
  page = 1,
  pageSize = 8,
}: PeriodSelectorOptionsModel = {}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1개월');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const getPeriodRange = (period: PeriodType) => {
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

  const createFilters = (period: PeriodType, currentPage: number = page) => {
    const filters: Record<string, unknown> = {
      page: currentPage,
      page_size: pageSize,
    };

    if (productId) {
      filters.product = productId;
    }

    if (period === '직접 설정' && customStartDate && customEndDate) {
      filters.start_date = customStartDate;
      filters.end_date = customEndDate;
    } else if (period !== '직접 설정') {
      const { startDate, endDate } = getPeriodRange(period);
      if (startDate && endDate) {
        filters.start_date = startDate;
        filters.end_date = endDate;
      }
    }

    return filters;
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setSelectedPeriod(newPeriod);
    if (onPeriodChange) {
      const filters = createFilters(newPeriod, 1);
      onPeriodChange(filters);
    }
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

  const handleCustomDateKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === 'Enter' &&
      customStartDate &&
      customEndDate &&
      productId &&
      onPeriodChange
    ) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const filters = createFilters('직접 설정');
      onPeriodChange(filters);
    }
  };

  // 일반 기간(1,3,6개월,1년) 검색
  useEffect(() => {
    if (!productId || !onPeriodChange) return;
    if (selectedPeriod === '직접 설정') return;

    const filters = createFilters(selectedPeriod);
    onPeriodChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, page, selectedPeriod]);

  // 직접 설정: 입력 후 0.5초 디바운스
  useEffect(() => {
    if (selectedPeriod !== '직접 설정' || !productId || !onPeriodChange) return;
    if (!customStartDate || !customEndDate) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const filters = createFilters('직접 설정');
      onPeriodChange(filters);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customStartDate,
    customEndDate,
    selectedPeriod,
    productId,
    page,
    onPeriodChange,
  ]);

  return {
    selectedPeriod,
    customStartDate,
    customEndDate,
    setCustomStartDate,
    setCustomEndDate,
    handlePeriodChange,
    handleDateAutoHyphen,
    handleCustomDateKeyDown,
    createFilters,
  };
};
