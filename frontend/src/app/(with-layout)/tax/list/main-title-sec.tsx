'use client';

import { TaxDocumentType } from '@/types/status-type';
import { useRouter, useSearchParams } from 'next/navigation';

interface MainTitleSecProps {
  selectedTaxType: TaxDocumentType | null;
  setSelectedTaxType: (type: TaxDocumentType | null) => void;
}

const MainTitleSec = ({
  selectedTaxType,
  setSelectedTaxType,
}: MainTitleSecProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabs: string[] = ['매출', '매입', '현금영수증'];

  const handleTabClick = (tab: string) => {
    if (tab === '매출') {
      setSelectedTaxType('sales');
      router.push('/tax/list?tab=sales');
    } else if (tab === '매입') {
      setSelectedTaxType('purchase');
      router.push('/tax/list?tab=purchase');
    } else if (tab === '현금영수증') {
      setSelectedTaxType(null);
      router.push('/tax/list?tab=receipt');
    }
  };

  const currentTab = searchParams.get('tab');
  const isReceiptTab = currentTab === 'receipt';

  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between relative">
        <div className="Heading-1 text-dg">채권 · 채무 관리</div>
      </div>

      <div className="flex gap-4 items-center Heading-3">
        {tabs.map((tab) => {
          const isActive =
            (tab === '매출' && currentTab === 'sales') ||
            (tab === '매입' && currentTab === 'purchase') ||
            (tab === '현금영수증' && isReceiptTab) ||
            // 쿼리 파라미터가 없을 때 기본값으로 매출 탭 활성화
            (tab === '매출' && !currentTab && selectedTaxType === 'sales');
          return (
            <button
              key={tab}
              className={`${isActive ? 'text-dg' : 'text-gr'} cursor-pointer`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MainTitleSec;
