'use client';

import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface SubscribeModalProps {
  onClose: () => void;
  planTitle: string;
  onSubscribe: () => Promise<void> | void;
  isLoading: boolean;
  endDate: string;
  isTrial?: boolean;
}

const SubscribeModal = ({
  onClose,
  planTitle,
  onSubscribe,
  isLoading,
  endDate,
  isTrial = false,
}: SubscribeModalProps) => {
  const t = useTranslations(
    'setting.systemSetting.subscription.subscribeModal'
  );
  const tCommon = useTranslations('common');

  // 하루 더한 날짜 계산
  const getNextDay = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  // 제목 결정
  const title = endDate
    ? t('title.change', { planTitle })
    : t('title.start', { planTitle });

  // 부제목 결정
  const getSubtitle = () => {
    if (isTrial && planTitle === 'Partners') {
      return t('subtitle.trialEndsPartners', { planTitle });
    }
    if (endDate) {
      const nextDate = getNextDay(endDate);
      if (isTrial) {
        return t('subtitle.trialEnds', { endDate, nextDate, planTitle });
      } else {
        return t('subtitle.currentPlanEnds', { endDate, nextDate, planTitle });
      }
    }
    if (planTitle === 'Basic') {
      return t('subtitle.basic');
    }
    return t('subtitle.partners');
  };

  return (
    <Modal title={title} subtitle={getSubtitle()} onClose={onClose}>
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text={tCommon('cancel')} variant="white" onClick={onClose} />
        <MiniBtn
          text={t('subscribeButton')}
          variant="secondary"
          onClick={async () => {
            await onSubscribe();
            onClose();
          }}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default SubscribeModal;
