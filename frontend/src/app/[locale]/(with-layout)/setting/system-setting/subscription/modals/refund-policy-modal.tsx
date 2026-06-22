'use client';

import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useTranslations } from 'next-intl';

interface RefundPolicyModalProps {
  onClose: () => void;
}

const RefundPolicyModal = ({ onClose }: RefundPolicyModalProps) => {
  const t = useTranslations(
    'setting.systemSetting.subscription.refundPolicyModal'
  );
  const tCommon = useTranslations('common');

  return (
    <Modal title={t('title')} onClose={onClose} scroll={true}>
      <div className="flex flex-col gap-4 mt-4 px-6 max-h-[calc(85vh-80px)] overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-2">
          <h4 className="Heading-4 text-dg">{t('freeTrial.title')}</h4>
          <ul className="list-disc list-inside">
            <li className="Re_Body-2 text-dg">
              {t('freeTrial.items.firstMonth')}
            </li>
            <li className="Re_Body-2 text-dg">
              {t('freeTrial.items.cancelDuringTrial')}
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="Heading-4 text-dg">{t('paidSubscription.title')}</h4>
          <ul className="list-disc list-inside">
            <li className="Re_Body-2 text-dg">
              {t('paidSubscription.items.noRefundAfterPayment')}
            </li>
            <li className="Re_Body-2 text-dg">
              {t('paidSubscription.items.cancelStopsBilling')}
            </li>
            <li className="Re_Body-2 text-dg">
              {t('paidSubscription.items.noPartialRefund')}
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="Heading-4 text-dg">{t('partialRefund.title')}</h4>
          <ul className="list-disc list-inside">
            <li className="Re_Body-2 text-dg">
              {t('partialRefund.items.monthlySubscription')}
            </li>
            <li className="Re_Body-2 text-dg">
              {t('partialRefund.items.serviceUntilMonthEnd')}
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="Heading-4 text-dg">{t('specialRefund.title')}</h4>
          <ul className="list-disc list-inside list-hanging">
            <li className="Re_Body-2 text-dg">
              {t('specialRefund.items.serviceInterruption')}
            </li>
          </ul>
        </div>

        <div className="flex justify-end mb-4">
          <MiniBtn text={tCommon('close')} variant="white" onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
};

export default RefundPolicyModal;
