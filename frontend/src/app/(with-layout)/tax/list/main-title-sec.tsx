'use client';

import { TaxDocumentType } from '@/types/status-type';
import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';
import CreatTaxPanel from './create-tax-panel';
import useMemberStore from '@/store/member-store';

interface MainTitleSecProps {
  selectedTaxType: TaxDocumentType | null;
  setSelectedTaxType: (type: TaxDocumentType | null) => void;
}

const MainTitleSec = ({
  selectedTaxType,
  setSelectedTaxType,
}: MainTitleSecProps) => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const tabs: string[] = ['전체', '매출', '매입'];

  const [isCreatTaxPanelOpen, setIsCreatTaxPanelOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
        <div className="flex items-center justify-between relative">
          <div className="Heading-1 text-dg">세금계산서 내역</div>
          <MiniBtn
            text="세금계산서 생성"
            variant="primary"
            onClick={() => {
              setIsCreatTaxPanelOpen(true);
            }}
            disabled={!factoryId || role === 'viewer'}
          />
        </div>

        <div className="flex gap-4 items-center Heading-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`${
                (tab === '전체' && selectedTaxType === null) ||
                (tab === '매출' && selectedTaxType === 'sales') ||
                (tab === '매입' && selectedTaxType === 'purchase')
                  ? 'text-dg'
                  : 'text-gr'
              } cursor-pointer`}
              onClick={() => {
                if (tab === '매출') {
                  setSelectedTaxType('sales');
                } else if (tab === '매입') {
                  setSelectedTaxType('purchase');
                } else {
                  setSelectedTaxType(null);
                }
              }}
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
