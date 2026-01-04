'use client';

import { useState } from 'react';
import MiniBtn from '@/ui/mini-btn';
import CreatTaxPanel from '../list/create-tax-panel';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

interface MainTitleSecProps {
  selectedTab: 'all' | 'temporary' | 'pending';
  setSelectedTab: (tab: 'all' | 'temporary' | 'pending') => void;
}

const MainTitleSec = ({ selectedTab, setSelectedTab }: MainTitleSecProps) => {
  const t = useTranslations('tax.draft');
  const tabs: Array<'all' | 'temporary' | 'pending'> = [
    'all',
    'temporary',
    'pending',
  ];
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const isPartnersSubscription = useSubscriptionStore((state) =>
    state.isPartnersSubscription()
  );
  const [isCreatTaxPanelOpen, setIsCreatTaxPanelOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
        <div className="flex items-center justify-between relative">
          <div className="Heading-1 text-dg">{t('title')}</div>
          <MiniBtn
            text={t('createButton')}
            variant="primary"
            onClick={() => {
              setIsCreatTaxPanelOpen(true);
            }}
            disabled={
              !factoryId ||
              role === 'viewer' ||
              role === 'prod_manager' ||
              !isPartnersSubscription
            }
          />
        </div>

        <div className="flex gap-4 items-center Heading-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`${selectedTab === tab ? 'text-dg' : 'text-gr'} cursor-pointer`}
              onClick={() => setSelectedTab(tab)}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {isCreatTaxPanelOpen && (
        <CreatTaxPanel onClose={() => setIsCreatTaxPanelOpen(false)} />
      )}
    </>
  );
};

export default MainTitleSec;
