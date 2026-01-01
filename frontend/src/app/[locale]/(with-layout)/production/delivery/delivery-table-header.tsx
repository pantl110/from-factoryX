'use client';

import { useTranslations } from 'next-intl';
import Checkbox from '@/ui/checkbox';
import useSubscriptionStore from '@/store/subscription-store';

interface DeliveryTableHeaderProps {
  isAllChecked: boolean;
  onToggleAll: () => void;
}

const DeliveryTableHeader = ({
  isAllChecked,
  onToggleAll,
}: DeliveryTableHeaderProps) => {
  const t = useTranslations('production.delivery');
  const tCommon = useTranslations('common');
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  return (
    <div className="flex items-center h-12 min-w-[1305px] Me_Body-1 rounded bg-lg-table cursor-default">
      {hasSubscription() && (
        <Checkbox isChecked={isAllChecked} onToggle={onToggleAll} />
      )}
      <p className="w-[150px] py-1 px-3 text-sv">{t('statusLabel')}</p>
      <p className="flex-[1.6] py-1 px-3 text-sv">{tCommon('productName')}</p>
      <p className="flex-1 py-1 px-3 text-sv">{tCommon('productCode')}</p>
      <p className="flex-1 py-1 px-3 text-sv">{tCommon('specification')}</p>
      <p className="flex-1 py-1 px-3 text-sv">{tCommon('unit')}</p>
      <p className="flex-1 py-1 px-3 text-sv">{t('quantity')}</p>
      <p className="flex-1 py-1 px-3 text-sv">{tCommon('deliveryDate')}</p>
    </div>
  );
};

export default DeliveryTableHeader;
