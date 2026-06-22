import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';
import DeleteAccountModal from './modals/delete-account-modal';
import { useLogout, useWithdraw } from '@/hooks';
import { useRouter } from '@/i18n/navigation';

const DeleteAccount = () => {
  const t = useTranslations('setting.systemSetting.general.deleteAccount');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { withdraw, isLoading } = useWithdraw();
  const { logout } = useLogout();
  const router = useRouter();

  const handleDeleteConfirm = async () => {
    try {
      await withdraw();
      // 계정삭제 성공 시 로그아웃 처리
      await logout();
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
          <h3 className="Heading-3">{t('title')}</h3>
          <p className="Me_Body-2 text-sv">{t('description')}</p>
        </div>
        <div className="flex justify-end">
          <MiniBtn
            variant="red"
            text={t('buttonText')}
            onClick={() => setIsDeleteModalOpen(true)}
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
