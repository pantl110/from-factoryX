'use client';

import TabItem from './tab-item';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const Tabbar = () => {
  const t = useTranslations('mobile.alarm.tabs');
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabs = useMemo(
    () => [
      { name: t('all'), param: 'all' },
      { name: t('deliveryStatus'), param: 'due-date' },
      { name: t('accountStatus'), param: 'payment-due' },
      { name: t('rop'), param: 'rop' },
      { name: t('expiry'), param: 'expiry' },
      { name: t('confirmationRequired'), param: 'confirmation-required' },
    ],
    [t]
  );

  const [selectedTab, setSelectedTab] = useState(
    searchParams.get('tab') || 'all'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some((t) => t.param === tab)) {
      setSelectedTab(tab);
    }
  }, [searchParams, tabs]);

  const handleTabChange = (param: string) => {
    setSelectedTab(param);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', param);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="sticky top-[50px] z-30 bg-wh px-6 border-t border-lg flex overflow-x-auto justify-between scrollbar-hide">
      <span className="absolute left-0 right-0 bottom-0 h-px bg-lg" />
      {tabs.map((tab, idx) => (
        <TabItem
          key={idx}
          text={tab.name}
          isSelected={selectedTab === tab.param}
          onClick={() => handleTabChange(tab.param)}
        />
      ))}
    </div>
  );
};

export default Tabbar;
