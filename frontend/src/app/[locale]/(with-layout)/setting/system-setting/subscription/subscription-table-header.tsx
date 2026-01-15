import { useTranslations } from 'next-intl';

const SubscriptionTableHeader = () => {
  const t = useTranslations(
    'setting.systemSetting.subscription.paymentHistory.table'
  );

  return (
    <div className="flex items-center justify-between w-full h-12 text-sv Me_Body-1 border-t border-b border-lg">
      <p className="flex-1">{t('date')}</p>
      <p className="flex-[2]">{t('card')}</p>
      <p className="flex-1">{t('amount')}</p>
      <p className="flex-1">{t('planName')}</p>
    </div>
  );
};

export default SubscriptionTableHeader;
