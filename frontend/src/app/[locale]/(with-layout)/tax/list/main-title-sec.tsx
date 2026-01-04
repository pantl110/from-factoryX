'use client';

import { TaxDocumentType } from '@/types/status-type';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

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
  const tDocument = useTranslations('document.type');
  const tNavigation = useTranslations('navigation');

  const tabs = [
    { key: 'sales', label: tDocument('salesTaxInvoice') },
    { key: 'purchase', label: tDocument('purchaseTaxInvoice') },
    { key: 'receipt', label: tDocument('cashReceipt') },
  ];

  const handleTabClick = (tabKey: string) => {
    if (tabKey === 'sales') {
      setSelectedTaxType('sales');
      router.push('/tax/list?tab=sales');
    } else if (tabKey === 'purchase') {
      setSelectedTaxType('purchase');
      router.push('/tax/list?tab=purchase');
    } else if (tabKey === 'receipt') {
      setSelectedTaxType(null);
      router.push('/tax/list?tab=receipt');
    }
  };

  const currentTab = searchParams.get('tab');
  const isReceiptTab = currentTab === 'receipt';

  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between relative">
        <div className="Heading-1 text-dg">
          {tNavigation('taxDropdown.list')}
        </div>
      </div>

      <div className="flex gap-4 items-center Heading-3">
        {tabs.map((tab) => {
          const isActive =
            (tab.key === 'sales' && currentTab === 'sales') ||
            (tab.key === 'purchase' && currentTab === 'purchase') ||
            (tab.key === 'receipt' && isReceiptTab) ||
            // 쿼리 파라미터가 없을 때 기본값으로 매출 탭 활성화
            (tab.key === 'sales' && !currentTab && selectedTaxType === 'sales');
          return (
            <button
              key={tab.key}
              className={`${isActive ? 'text-dg' : 'text-gr'} cursor-pointer`}
              onClick={() => handleTabClick(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MainTitleSec;
