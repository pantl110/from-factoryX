import { InfoLabelValue } from '@/ui';
import { useTranslations } from 'next-intl';

interface DepositorInfoDisplayProps {
  depositorName?: string;
}

// 입금 확인 정보 표시 컴포넌트 (매출용)
export const DepositorInfoDisplay = ({
  depositorName,
}: DepositorInfoDisplayProps) => {
  const t = useTranslations('setting.masterData.client.depositorInfo');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">{t('title')}</h3>

      <div>
        <div className="flex border-b border-lg w-full">
          <InfoLabelValue
            label={t('depositorName')}
            value={depositorName || '-'}
          />
        </div>
      </div>
    </div>
  );
};
