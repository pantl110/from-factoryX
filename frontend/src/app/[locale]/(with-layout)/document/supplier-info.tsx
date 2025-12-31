'use client';

import { useTranslations } from 'next-intl';
import InfoLabelValue from '@/ui/info-label-value';
import { ClientModel } from '@/types/data-model';

interface SupplierInfoProps {
  clientData: ClientModel;
  dueDate: string;
}

const SupplierInfo = ({ clientData, dueDate }: SupplierInfoProps) => {
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
            value={clientData.name}
          />
          <InfoLabelValue
            label={tCommon('businessRegistrationNumber')}
            value={clientData.business_registration_number}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label={tCommon('representativeName')}
            value={clientData.representative_name}
          />
          <InfoLabelValue label={tCommon('dueDate')} value={dueDate} />
        </div>
        <div className="flex">
          <InfoLabelValue
            label={tCommon('businessType')}
            value={clientData.business_type}
          />
          <InfoLabelValue
            label={tCommon('businessCategory')}
            value={clientData.business_category}
          />
        </div>
        <div className="flex">
          <InfoLabelValue label={tCommon('email')} value={clientData.email} />
          <InfoLabelValue label={tCommon('phone')} value={clientData.phone} />
        </div>
        <InfoLabelValue label={tCommon('fax')} value={clientData.fax} />
        <InfoLabelValue
          label={tCommon('businessAddress')}
          value={clientData.address}
        />
      </div>
    </div>
  );
};

export default SupplierInfo;
