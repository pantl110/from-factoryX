'use client';

import MoBtn from './mo-btn';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface MoBottomNavigationProps {
  type: 'income' | 'outcome' | 'delivery' | 'scan' | 'mail';
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
  const tTableArea = useTranslations('tax.list.tableArea.buttons');
  const tSendEmailModal = useTranslations('tax.list.sendEmailModal');

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
      case 'mail':
        return tSendEmailModal('sendButton');
      default:
        return t('nextScan');
    }
  };

  const getConfirmText = () => {
    switch (type) {
      case 'income':
        return tTableArea('enterDeposit');
      case 'outcome':
        return tTableArea('enterPayment');
      case 'scan':
        return t('confirm');
      default:
        return '';
    }
  };

  return (
    <div className="fixed bottom-0 z-30 w-full bg-wh px-3 pt-5 pb-6 border-t border-bg shadow-[0px_1px_22px_0px_rgba(0,0,0,0.06)] flex flex-col gap-2">
      {/* 바코드 스캔에서 */}
      {type === 'scan' && (
        <MoBtn
          text={getConfirmText()}
          variant="outline"
          big
          width="w-full"
          onClick={onConfirm || (() => router.back())}
        />
      )}

      {/* 정산 현황에서 */}
      {(type === 'income' || type === 'outcome') && (
        <MoBtn
          text={getConfirmText()}
          variant="primary"
          big
          width="w-full"
          onClick={onConfirm || (() => router.back())}
        />
      )}

      {type !== 'income' && type !== 'outcome' && (
        <MoBtn
          text={getButtonText()}
          variant="primary"
          big
          width="w-full"
          onClick={onClick}
        />
      )}
    </div>
  );
};

export default MoBottomNavigation;
