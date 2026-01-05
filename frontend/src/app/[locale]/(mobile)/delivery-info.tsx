import { MoBtn, MoInput } from '@/ui';
import { LabelInfo } from './label-info';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface DeliveryInfoProps {
  isOrderPage?: boolean;
  address?: string | null;
  dueDate?: string | null;
}

const DeliveryInfo = ({
  isOrderPage = false,
  address,
  dueDate,
}: DeliveryInfoProps) => {
  const t = useTranslations('mobile.deliveryInfo');
  const tCommon = useTranslations('common');
  const [deliveryType, setDeliveryType] = useState<string>('');

  const handleDeliveryType = (type: string) => {
    setDeliveryType(type);
  };

  const parcelText = t('parcel');
  const cargoText = t('cargo');
  const directText = t('direct');

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">{t('title')}</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo
          label={tCommon('businessAddress')}
          value={address || '-'}
          direction="col"
        />
        {isOrderPage || (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <LabelInfo label={t('deliveryMethod')} />
              <div className="flex gap-2.5">
                <MoBtn
                  text={parcelText}
                  variant={
                    deliveryType === parcelText ? 'outline-primary' : 'outline'
                  }
                  width="flex-1"
                  onClick={() => handleDeliveryType(parcelText)}
                />
                <MoBtn
                  text={cargoText}
                  variant={
                    deliveryType === cargoText ? 'outline-primary' : 'outline'
                  }
                  width="flex-1"
                  onClick={() => handleDeliveryType(cargoText)}
                />
                <MoBtn
                  text={directText}
                  variant={
                    deliveryType === directText ? 'outline-primary' : 'outline'
                  }
                  width="flex-1"
                  onClick={() => handleDeliveryType(directText)}
                />
              </div>
            </div>
            {deliveryType === parcelText && (
              <MoInput
                label={t('trackingNumber')}
                placeholder={t('trackingNumberPlaceholder')}
              />
            )}
            {deliveryType === cargoText && (
              <MoInput
                label={t('vehicleNumber')}
                placeholder={t('vehicleNumberPlaceholder')}
              />
            )}
          </div>
        )}
        <div className="h-[1px] bg-bg" />

        <LabelInfo label={tCommon('dueDate')} value={dueDate || '-'} />
      </div>

      {/* {isOrderPage || (
        <div className="flex gap-3 items-center px-2 py-3 bg-bg rounded-[8px]">
          <div className="w-1.5 h-1.5 bg-lg rounded-full" />
          <h3 className="m-Body-4 text-primary">
            거래명세서와 납품표는 PC에서 확인하실 수 있습니다
          </h3>
        </div>
      )} */}
    </div>
  );
};

export default DeliveryInfo;
