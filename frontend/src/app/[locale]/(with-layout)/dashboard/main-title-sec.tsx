'use client';

import { useTranslations } from 'next-intl';
import { GearSix } from '@phosphor-icons/react';
import IconBtn from '@/ui/icon-btn';

interface MainTitleSecProps {
  onOpenSettings?: () => void;
}

const MainTitleSec = ({ onOpenSettings }: MainTitleSecProps) => {
  const t = useTranslations('dashboard');

  return (
    <div className="pt-10 px-10 flex items-center justify-between">
      <h1 className="Heading-1">{t('mainTitle')}</h1>
      {onOpenSettings && (
        <IconBtn
          icon={GearSix}
          onClick={onOpenSettings}
          aria-label={t('widgetSettings.title')}
        />
      )}
    </div>
  );
};

export default MainTitleSec;
