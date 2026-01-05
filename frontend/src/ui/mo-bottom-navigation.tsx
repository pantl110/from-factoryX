import MoBtn from './mo-btn';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface MoBottomNavigationProps {
  type: 'income' | 'outcome' | 'delivery' | 'scan';
  onClick: () => void;
  onConfirm?: () => void;
}

const MoBottomNavigation = ({
  type,
  onClick,
  onConfirm,
}: MoBottomNavigationProps) => {
  const router = useRouter();
  const t = useTranslations('common.moBottomNavigation');

  const getButtonText = () => {
    switch (type) {
      case 'income':
        return t('depositComplete');
      case 'outcome':
        return t('paymentComplete');
      case 'delivery':
        return t('deliveryComplete');
      case 'scan':
        return t('nextScan');
      default:
        return t('nextScan');
    }
  };

  return (
    <div className="fixed bottom-0 z-30 w-full bg-wh px-3 pt-5 pb-6 border-t border-bg shadow-[0px_1px_22px_0px_rgba(0,0,0,0.06)] flex flex-col gap-2">
      {type === 'scan' && (
        <MoBtn
          text={t('confirm')}
          variant="outline"
          big
          width="w-full"
          onClick={onConfirm || (() => router.back())}
        />
      )}

      <MoBtn
        text={getButtonText()}
        variant="primary"
        big={true}
        width="w-full"
        onClick={onClick}
      />
    </div>
  );
};

export default MoBottomNavigation;
