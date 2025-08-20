import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';
import DeleteAccountModal from './modals/delete-account-modal';
import { useWithdraw } from '@/hooks/users/use-withdraw';
import { useRouter } from 'next/navigation';

const DeleteAccount = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { withdraw, isLoading } = useWithdraw();
  const router = useRouter();

  const handleDeleteConfirm = async () => {
    try {
      await withdraw();
      // 성공 시 모달은 자동으로 닫히고 로그인페이지로 이동됨
    } catch {
      // 에러는 useWithdraw에서 처리됨
    } finally {
      setIsDeleteModalOpen(false);
      router.push('/');
    }
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
          onClose={() => {
            if (!isLoading) {
              setIsDeleteModalOpen(false);
            }
          }}
          onConfirm={handleDeleteConfirm}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default DeleteAccount;
