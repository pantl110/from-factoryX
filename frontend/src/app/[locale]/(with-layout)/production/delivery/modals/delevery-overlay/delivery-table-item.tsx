'use client';

import { useTranslations } from 'next-intl';
import InfoLabelValue from '@/ui/info-label-value';

interface DeliveryTableItemProps {
  data: {
    companyName: string;
    productName: string;
    spec: string;
    unit: string;
    quantity: number;
  };
  isLast?: boolean;
}

const DeliveryTableItem = ({
  data,
  isLast = false,
}: DeliveryTableItemProps) => {
  const tCommon = useTranslations('common');
  const tDelivery = useTranslations('production.delivery');

  return (
    <div className={`flex flex-col ${isLast ? '' : 'pb-8 border-b border-lg'}`}>
      <InfoLabelValue label={tDelivery('company')} value={data.companyName} />
      <InfoLabelValue label={tCommon('productName')} value={data.productName} />
      <InfoLabelValue label={tCommon('specification')} value={data.spec} />
      <InfoLabelValue label={tCommon('unit')} value={data.unit} />
      <InfoLabelValue label={tDelivery('quantity')} value={data.quantity} />
    </div>
  );
};

export default DeliveryTableItem;
