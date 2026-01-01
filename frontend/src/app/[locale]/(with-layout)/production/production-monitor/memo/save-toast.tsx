import { useTranslations } from 'next-intl';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';

interface SaveToastProps {
  isVisible: boolean;
}

const SaveToast = ({ isVisible }: SaveToastProps) => {
  const t = useTranslations('production.productionLog.memo.toast');

  return (
    <Toast
      icon={<WarningCircle size={20} className="text-primary" />}
      text={t('saveSuccess')}
      subtext={t('saveSuccessSubtext')}
      type="primary"
      isVisible={isVisible}
    />
  );
};

export default SaveToast;
