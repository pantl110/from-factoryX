import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface ProductionPlanSaveModalProps {
  onClose: () => void;
  onSave: () => void;
  isLoading?: boolean;
}

const ProductionPlanSaveModal = ({
  onClose,
  onSave,
  isLoading = false,
}: ProductionPlanSaveModalProps) => {
  const t = useTranslations('production.productionPlanSaveModal');
  const tCommon = useTranslations('common');

  return (
    <Modal
      title={t('title')}
      subtitle={t('subtitle')}
      onClose={isLoading ? () => {} : onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn variant="white"
          text={tCommon('cancel')}
          onClick={onClose}
        />
        <MiniBtn variant="secondary"
          text={tCommon('save')}
          onClick={onSave}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default ProductionPlanSaveModal;
