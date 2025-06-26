import { useState } from "react";

export function useDeleteMode() {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 삭제 버튼 클릭 시
  const toggleDeleteMode = () => {
    if (!isDeleteMode) {
      setIsDeleteMode(true);
    } else {
      setIsDeleteModalOpen(true);
    }
  };

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setIsDeleteMode(false);
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
