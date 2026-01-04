'use client';

import { useTranslations } from 'next-intl';
import InfoLabelValue from '@/ui/info-label-value';
import { TaxFactoryInfoModel } from '@/types/data-model';

interface SellerInfoProps {
  lastDeliveryDate: string;
  factoryData: TaxFactoryInfoModel;
}

const SellerInfo = ({ lastDeliveryDate, factoryData }: SellerInfoProps) => {
  const tCommon = useTranslations('common');
  const tDocument = useTranslations('document');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">
        {tCommon('sellerInfo')}
      </h3>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <InfoLabelValue
            label={tCommon('companyName')}
            value={factoryData?.name || '-'}
          />
          <InfoLabelValue
            label={tCommon('businessRegistrationNumber')}
            value={factoryData?.business_registration_number || '-'}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label={tCommon('representativeName')}
            value={factoryData?.representative_name || '-'}
          />
          <InfoLabelValue
            label={tDocument('finalDeliveryDate')}
            value={lastDeliveryDate}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label={tCommon('businessType')}
            value={factoryData?.business_type || '-'}
          />
          <InfoLabelValue
            label={tCommon('businessCategory')}
            value={factoryData?.business_category || '-'}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label={tCommon('email')}
            value={factoryData?.manager_email || '-'}
          />
          <InfoLabelValue
            label={tCommon('phone')}
            value={factoryData?.manager_phone || '-'}
          />
        </div>
        <InfoLabelValue
          label={tCommon('fax')}
          value={factoryData?.manager_fax || '-'}
        />
        <InfoLabelValue
          label={tCommon('businessAddress')}
          value={factoryData?.business_address || '-'}
        />
      </div>
    </div>
  );
};

export default SellerInfo;
