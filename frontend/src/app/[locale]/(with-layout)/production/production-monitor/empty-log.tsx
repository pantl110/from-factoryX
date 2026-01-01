import { useTranslations } from 'next-intl';

const EmptyLog = () => {
  const t = useTranslations('production.productionLog.empty');

  return (
    <div className="mb-10 flex flex-col justify-center items-center gap-1 w-full h-full border border-lg rounded p-10">
      <h4 className="Heading-4 text-dg">{t('title')}</h4>
      <p className="Re_Body-1 text-gr">{t('description')}</p>
    </div>
  );
};

export default EmptyLog;
