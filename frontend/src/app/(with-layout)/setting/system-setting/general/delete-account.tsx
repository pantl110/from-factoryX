import MiniBtn from "@/ui/mini-btn";
import { useState } from "react";
import DeleteAccountModal from "./modals/delete-account-modal";

const DeleteAccount = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = () => {
    // 실제 계정 삭제 로직 추후 추가
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-7 pt-8 pb-10">
        <div className="flex flex-col gap-4">
          <h3 className="Heading-3">계정 삭제</h3>
          <p className="Me_Body-2 text-sv">
            계정 삭제는 되돌릴 수 없습니다. 삭제 후에는 모든 개인 정보 및 사용
            기록이 즉시 제거되며, 다시 복구할 수 없습니다. <br />
            계속하시겠습니까?
          </p>
        </div>
        <div className="flex justify-end">
          <MiniBtn
            text="계정 삭제"
            bgColor="bg-red-8"
            textColor="text-red"
            onClick={() => setIsDeleteModalOpen(true)}
            hoverColor="hover:bg-red-hover"
          />
        </div>
      </div>

      {/* 모달 */}
      {isDeleteModalOpen && (
        <DeleteAccountModal
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
};

export default DeleteAccount;
