'use client';

import { useTranslations } from 'next-intl';
import InfoLabelValue from '@/ui/info-label-value';
import { QuotationResponseModel } from '@/types/data-model';

interface BuyerInfoProps {
  quotationData: QuotationResponseModel;
}

const BuyerInfo = ({ quotationData }: BuyerInfoProps) => {
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">
        {tCommon('clientInfo')}
      </h3>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <InfoLabelValue
            label={tCommon('companyName')}
            value={quotationData.factory_name}
          />
          <InfoLabelValue
            label={tCommon('businessRegistrationNumber')}
            value={quotationData.business_registration_number}
          />
        </div>
        <InfoLabelValue
          label={tCommon('representativeName')}
          value={quotationData.representative_name}
        />
        <div className="flex">
          <InfoLabelValue
            label={tCommon('businessType')}
            value={quotationData.business_type}
          />
          <InfoLabelValue
            label={tCommon('businessCategory')}
            value={quotationData.business_category}
          />
        </div>
        <InfoLabelValue
          label={tCommon('businessAddress')}
          value={quotationData.address}
        />
        <div className="flex">
          <InfoLabelValue
            label={tCommon('email')}
            value={quotationData.email}
          />
          <InfoLabelValue
            label={tCommon('phone')}
            value={quotationData.phone}
          />
        </div>
        <InfoLabelValue label={tCommon('fax')} value={quotationData.fax} />
      </div>
    </div>
  );
};

export default BuyerInfo;
