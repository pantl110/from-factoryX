import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface NeedInfoModalProps {
  onClose: () => void;
  onSaveDraft: (isConfirm: boolean) => boolean | Promise<boolean>;
  isOrderStatus: boolean;
}

const NeedInfoModal = ({
  onClose,
  onSaveDraft,
  isOrderStatus,
}: NeedInfoModalProps) => {
  const router = useRouter();
  const t = useTranslations('quotation.needInfoModal');
  const tCommon = useTranslations('common');

  return (
    <Modal title={t('title')} subtitle={t('subtitle')} onClose={onClose}>
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text={tCommon('close')} variant="white" onClick={onClose} />
        <MiniBtn
          text={t('goToCompanyInfo')}
          variant="primary"
          onClick={() => {
            onSaveDraft(isOrderStatus);
            onClose();
            router.push('/setting');
          }}
        />
      </div>
    </Modal>
  );
};

export default NeedInfoModal;
