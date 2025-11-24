'use client';

import TabItem from './tab-item';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const Tabbar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabs = useMemo(
    () => [
      { name: '전체', param: 'all' },
      { name: '납기 도래', param: 'due-date' },
      // { name: '정산 현황', param: 'payment-due' },
      { name: 'ROP', param: 'rop' },
      { name: '유통기한', param: 'expiry' },
      { name: '확정 필요 주문', param: 'confirmation-required' },
    ],
    []
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
    <div className="sticky top-[50px] z-30 bg-wh px-6 border-y border-lg flex overflow-x-auto justify-between scrollbar-hide">
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
