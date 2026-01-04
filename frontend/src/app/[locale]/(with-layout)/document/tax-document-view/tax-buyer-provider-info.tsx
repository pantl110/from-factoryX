'use client';

import { useTranslations } from 'next-intl';
import { TaxDocumentType } from '@/types/status-type';
import InfoLabelValue from '@/ui/info-label-value';
import { TaxClientInfoModel } from '@/types/data-model';

interface TaxBuyerProviderInfoProps {
  taxType: TaxDocumentType;
  clientInfo: TaxClientInfoModel;
}

const TaxBuyerProviderInfo = ({
  taxType,
  clientInfo,
}: TaxBuyerProviderInfoProps) => {
  const tCommon = useTranslations('common');
  const tTax = useTranslations('tax');

  // clientInfo가 null인 경우 처리
  if (!clientInfo) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 h-10 items-center flex">
          {taxType === 'sales' ? tTax('sellerInfo') : tTax('buyerInfo')}
        </h3>
        <div className="width-full border-b border-lg">
          <InfoLabelValue label={tCommon('clientName')} value="-" />
          <InfoLabelValue
            label={tCommon('businessRegistrationNumber')}
            value="-"
          />
          <InfoLabelValue label={tCommon('representativeName')} value="-" />
          <div className="flex">
            <InfoLabelValue label={tCommon('businessType')} value="-" />
            <InfoLabelValue label={tCommon('businessCategory')} value="-" />
          </div>
          <InfoLabelValue label={tCommon('businessAddress')} value="-" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">
        {taxType === 'sales' ? tTax('sellerInfo') : tTax('buyerInfo')}
      </h3>
      <div className="width-full border-b border-lg">
        <InfoLabelValue
          label={tCommon('clientName')}
          value={clientInfo.name || '-'}
        />
        <InfoLabelValue
          label={tCommon('businessRegistrationNumber')}
          value={clientInfo.business_registration_number || '-'}
        />
        <InfoLabelValue
          label={tCommon('representativeName')}
          value={clientInfo.representative_name || '-'}
        />
        <div className="flex">
          <InfoLabelValue
            label={tCommon('businessType')}
            value={clientInfo.business_type || '-'}
          />
          <InfoLabelValue
            label={tCommon('businessCategory')}
            value={clientInfo.business_category || '-'}
          />
        </div>
        <InfoLabelValue
          label={tCommon('businessAddress')}
          value={clientInfo.address || '-'}
        />
      </div>
    </div>
  );
};

export default TaxBuyerProviderInfo;
