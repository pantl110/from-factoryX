import { TaxClientInfoModel } from '@/types/data-model';
import { LabelInfo } from './label-info';
import { useTranslations } from 'next-intl';

interface ClientInfoProps {
  clientInfo?: TaxClientInfoModel | null;
}

const ClientInfo = ({ clientInfo }: ClientInfoProps) => {
  const t = useTranslations('common');

  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">{t('clientInfo')}</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo label={t('clientName')} value={clientInfo?.name || '-'} />
        <LabelInfo
          label={t('businessRegistrationNumber')}
          value={clientInfo?.business_registration_number || '-'}
        />
        <LabelInfo
          label={t('representativeName')}
          value={clientInfo?.representative_name || '-'}
        />
        <LabelInfo
          label={t('businessType')}
          value={clientInfo?.business_type || '-'}
        />
        <LabelInfo
          label={t('businessCategory')}
          value={clientInfo?.business_category || '-'}
        />
        <div className="h-[1px] bg-bg" />
        <LabelInfo
          label={t('managerName')}
          value={clientInfo?.manager || '-'}
        />
        <LabelInfo label={t('email')} value={clientInfo?.email || '-'} />
        <LabelInfo label={t('phone')} value={clientInfo?.phone || '-'} />
        <LabelInfo label={t('fax')} value={clientInfo?.fax || '-'} />
      </div>
    </div>
  );
};

export default ClientInfo;
