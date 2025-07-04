import { useState } from "react";

/**
 * @param selectedIds 체크된 아이템 id 배열 (외부에서 관리)
 */
export function useDeleteMode<T = string | number>() {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 삭제 버튼 클릭 시
  const toggleDeleteMode = (selectedIds: T[]) => {
    if (!isDeleteMode) {
      setIsDeleteMode(true);
    } else if (selectedIds.length > 0) {
      setIsDeleteModalOpen(true);
    } else {
      setIsDeleteMode(false);
    }
  };

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  // 삭제 완료/취소 시
  const resetDeleteMode = () => {
    setIsDeleteMode(false);
    setIsDeleteModalOpen(false);
  };

  return {
    isDeleteMode,
    isDeleteModalOpen,
    toggleDeleteMode,
    closeDeleteModal,
    resetDeleteMode,
  };
}
