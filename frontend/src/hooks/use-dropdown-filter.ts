'use client';

import { useState, useMemo } from 'react';

// items: 전체 리스트
// getLabel: 아이템에서 비교할 문자열 추출 함수 (예: item => item.productName)

export function useDropdownFilter<T>(
  items: T[],
  getLabel: (item: T) => string
) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 입력값으로 필터링된 리스트
  const filtered = useMemo(
    () =>
      input
        ? items.filter(
            (item) => item && getLabel(item) && getLabel(item).startsWith(input)
          )
        : [],
    [input, items, getLabel]
  );

  // 입력값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setInput(value);
    const nextFiltered = value
      ? items.filter(
          (item) => item && getLabel(item) && getLabel(item).startsWith(value)
        )
      : [];
    setIsOpen(!!value && nextFiltered.length > 0);
  };

  // 드롭다운 아이템 선택 핸들러
  const handleSelect = (item: T) => {
    setInput(getLabel(item));
    setIsOpen(false);
  };

  return {
    input,
    setInput,
    isOpen,
    setIsOpen,
    filtered,
    handleInputChange,
    handleSelect,
  };
}
