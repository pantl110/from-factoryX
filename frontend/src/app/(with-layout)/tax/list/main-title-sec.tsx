import { TaxDocumentType } from '@/types/status-type';
import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';
import CreatTaxPanel from './modals/create-tax-panel';

interface MainTitleSecProps {
  selectedTaxType: TaxDocumentType | '전체';
  setSelectedTaxType: (type: TaxDocumentType | '전체') => void;
}

const MainTitleSec = ({
  selectedTaxType,
  setSelectedTaxType,
}: MainTitleSecProps) => {
  const tabs: (TaxDocumentType | '전체')[] = ['전체', '매출', '매입'];

  const [isCreatTaxPanelOpen, setIsCreatTaxPanelOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
        <div className="flex items-center justify-between relative">
          <div className="Heading-1 text-dg">세금계산서 내역</div>
          <MiniBtn
            text="세금계산서 생성"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            onClick={() => {
              setIsCreatTaxPanelOpen(true);
            }}
          />
        </div>

        <div className="flex gap-4 items-center Heading-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`${selectedTaxType === tab ? 'text-dg' : 'text-gr'} cursor-pointer`}
              onClick={() => setSelectedTaxType(tab)}
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
