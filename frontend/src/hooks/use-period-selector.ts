'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

export type PeriodType = '1개월' | '3개월' | '6개월' | '1년' | '직접 설정';

interface PeriodSelectorOptionsModel {
  onPeriodChange?: (filters: Record<string, unknown>) => void;
  productId?: number | null;
  materialId?: number | null;
  page?: number;
  pageSize?: number;
}

export const usePeriodSelector = ({
  onPeriodChange,
  productId,
  materialId,
  page = 1,
  pageSize = 5,
}: PeriodSelectorOptionsModel = {}) => {
  const tErrors = useTranslations('common.errors');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1개월');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<string>(''); // 이전 요청값을 저장

  // productId 또는 materialId 중 하나라도 있으면 true
  const hasValidId = productId || materialId;

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

  // 날짜 유효성 검사 함수
  const validateDate = (dateString: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      !isNaN(date.getTime())
    );
  };

  // 날짜 범위 유효성 검사 함수
  const validateDateRange = (
    startDate: string,
    endDate: string
  ): { isValid: boolean; message?: string } => {
    if (!validateDate(startDate)) {
      return { isValid: false, message: tErrors('invalidStartDate') };
    }
    if (!validateDate(endDate)) {
      return { isValid: false, message: tErrors('invalidEndDate') };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return {
        isValid: false,
        message: tErrors('startDateAfterEndDate'),
      };
    }

    return { isValid: true };
  };

  const createFilters = (period: PeriodType, currentPage: number = page) => {
    const filters: Record<string, unknown> = {
      page: currentPage,
      page_size: pageSize,
    };

    if (productId) {
      filters.product_id = productId;
    }
    if (materialId) {
      filters.material_id = materialId;
    }

    if (period === '직접 설정' && customStartDate && customEndDate) {
      const validation = validateDateRange(customStartDate, customEndDate);
      if (!validation.isValid) {
        // 유효하지 않은 날짜 범위일 때는 에러를 throw하여 요청을 중단
        alert(validation.message || tErrors('invalidDate'));
        return filters; // Return the partial filters object instead of undefined
      }
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

  // 요청을 보내는 함수 (중복 체크 포함)
  const sendRequest = (filters: Record<string, unknown>) => {
    try {
      const requestKey = JSON.stringify(filters);

      // 이전 요청과 같으면 중복 요청 방지
      if (lastRequestRef.current === requestKey) {
        return;
      }

      lastRequestRef.current = requestKey;
      onPeriodChange?.(filters);
    } catch (error) {
      // 날짜 유효성 검사 실패 시 토스트 표시
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setSelectedPeriod(newPeriod);
    // 직접 설정 버튼 클릭 시에는 GET 요청을 하지 않고 커스텀 날짜값을 리셋
    if (newPeriod === '직접 설정') {
      setCustomStartDate('');
      setCustomEndDate('');
    } else if (onPeriodChange) {
      const filters = createFilters(newPeriod, 1);
      if (filters) {
        sendRequest(filters);
      }
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
      hasValidId &&
      onPeriodChange
    ) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const filters = createFilters('직접 설정');
      if (filters) {
        sendRequest(filters);
      }
    }
  };

  // 일반 기간(1,3,6개월,1년) 검색
  useEffect(() => {
    if (!hasValidId || !onPeriodChange) return;
    if (selectedPeriod === '직접 설정') return;

    const filters = createFilters(selectedPeriod);
    if (filters) {
      sendRequest(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidId, page, selectedPeriod]);

  // 직접 설정: 입력 후 0.5초 디바운스
  useEffect(() => {
    if (selectedPeriod !== '직접 설정' || !hasValidId || !onPeriodChange)
      return;

    // 날짜가 완전히 입력되었는지 확인 (YYYY-MM-DD 형식)
    const isStartDateComplete =
      customStartDate.length === 10 &&
      /^\d{4}-\d{2}-\d{2}$/.test(customStartDate);
    const isEndDateComplete =
      customEndDate.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(customEndDate);

    if (!isStartDateComplete || !isEndDateComplete) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const filters = createFilters('직접 설정');
      if (filters) {
        sendRequest(filters);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customStartDate,
    customEndDate,
    selectedPeriod,
    hasValidId,
    page,
    onPeriodChange,
  ]);

  return {
    selectedPeriod,
    customStartDate,
    customEndDate,
    handleStartDateChange: setCustomStartDate,
    handleEndDateChange: setCustomEndDate,
    handlePeriodChange,
    handleDateAutoHyphen,
    handleCustomDateKeyDown,
    createFilters,
  };
};
