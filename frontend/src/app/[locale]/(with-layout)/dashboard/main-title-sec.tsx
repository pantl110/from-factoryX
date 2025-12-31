'use client';

import { useTranslations } from 'next-intl';

const MainTitleSec = () => {
  const t = useTranslations('dashboard');

  return (
    <div className="pt-10 px-10">
      <h1 className="Heading-1">{t('mainTitle')}</h1>
    </div>
  );
};

export default MainTitleSec;
