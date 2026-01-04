import { InfoLabelValue } from '@/ui';
import { useTranslations } from 'next-intl';

interface AccountInfoDisplayProps {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

// 지급 계좌 정보 표시 컴포넌트 (매입용)
export const AccountInfoDisplay = ({
  bankName,
  accountNumber,
  accountHolder,
}: AccountInfoDisplayProps) => {
  const t = useTranslations('setting.masterData.client.accountInfo');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">{t('title')}</h3>

      <div>
        <div className="flex">
          <InfoLabelValue label={t('bankName')} value={bankName || '-'} />
          <InfoLabelValue
            label={t('accountNumber')}
            value={accountNumber || '-'}
          />
        </div>
        <div className="flex border-b border-lg w-full">
          <InfoLabelValue label={t('holder')} value={accountHolder || '-'} />
        </div>
      </div>
    </div>
  );
};
