'use client';

import { useState } from 'react';
import MiniBtn from '@/ui/mini-btn';
import CreatTaxPanel from '../list/create-tax-panel';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface MainTitleSecProps {
  selectedTab: '전체' | '임시 저장' | '전송 대기';
  setSelectedTab: (tab: '전체' | '임시 저장' | '전송 대기') => void;
}

const MainTitleSec = ({ selectedTab, setSelectedTab }: MainTitleSecProps) => {
  const tabs = ['전체', '임시 저장', '전송 대기'];
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
          <div className="Heading-1 text-dg">세금계산서 작성함</div>
          <MiniBtn
            text="세금계산서 생성하기"
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
              onClick={() =>
                setSelectedTab(tab as '전체' | '임시 저장' | '전송 대기')
              }
            >
              {tab}
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
