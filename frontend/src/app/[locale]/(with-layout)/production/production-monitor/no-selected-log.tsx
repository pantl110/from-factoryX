import { useTranslations } from 'next-intl';

const NoSelectedLog = () => {
  const t = useTranslations('production.productionLog.noSelectedLog');

  return (
    <div className="border border-lg rounded flex items-center justify-center flex-col gap-1 h-full">
      <h4 className="Heading-4 text-dg">{t('title')}</h4>
      <p className="Re_Body-1 text-gr">{t('description')}</p>
    </div>
  );
};

export default NoSelectedLog;
