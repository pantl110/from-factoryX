import { useState, useCallback } from "react";

/**
 * 테이블 전체 선택/해제 및 개별 선택을 관리하는 커스텀 훅
 * @param itemIds 체크할 row의 고유 id 배열
 */
export function useCheckAll<T extends string | number>(itemIds: T[]) {
  const [checkedIds, setCheckedIds] = useState<T[]>([]);

  const isAllChecked =
    itemIds.length > 0 && checkedIds.length === itemIds.length; // 전체 선택 여부
  const isChecked = (id: T) => checkedIds.includes(id); // 개별 체크 여부
  const checkedCount = checkedIds.length; // 선택된 항목 수

  // 삭제 버튼 텍스트 생성
  const getDeleteButtonText = () => {
    if (checkedCount === 0) return "삭제";
    if (isAllChecked) return "전체 삭제";
    return `${checkedCount}개 항목 삭제`;
  };

  // 전체 토글
  const toggleAll = useCallback(() => {
    if (isAllChecked) {
      setCheckedIds([]);
    } else {
      setCheckedIds(itemIds);
    }
  }, [isAllChecked, itemIds]);

  // 개별 토글
  const toggleOne = useCallback((id: T) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }, []);

  // 외부에서 체크 상태를 직접 세팅하고 싶을 때
  const setAllChecked = (checked: boolean) => {
    setCheckedIds(checked ? itemIds : []);
  };

  return {
    checkedIds,
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  };
}
