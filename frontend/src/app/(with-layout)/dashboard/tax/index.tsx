'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MiniBtn from '@/ui/mini-btn';
import TaxItem from './tax-item';
import TaxDetailPanel from '@/app/(with-layout)/tax/tax-detail-panel';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

interface TaxProps {
  taxInvoicesData: PublishedTaxInvoiceResponseModel[];
  isLoading: boolean;
}

const Tax = ({ taxInvoicesData, isLoading }: TaxProps) => {
  const router = useRouter();
  const [selectedTax, setSelectedTax] =
    useState<PublishedTaxInvoiceResponseModel | null>(null);

  const handleTaxClick = (tax: PublishedTaxInvoiceResponseModel) => {
    setSelectedTax(tax);
  };

  const handleClosePanel = () => {
    setSelectedTax(null);
  };

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0 gap-3">
        <div className="flex items-center justify-between">
          <h3 className="Heading-3">세금계산서 현황</h3>
          <MiniBtn
            text="더보기"
            textColor="text-dg"
            borderColor="border-lg"
            onClick={() => {
              router.push('/tax/list');
            }}
            hoverColor="hover:bg-bg"
          />
        </div>
        <div className="flex flex-col gap-3">
          {isLoading || taxInvoicesData.length === 0 ? (
            <NoHistoryBox
              title="아직 발행된 세금계산서가 없어요."
              text="발행된 세금계산서는 최신순으로 보여져요."
            />
          ) : (
            taxInvoicesData.map((tax) => (
              <TaxItem
                key={tax.id}
                taxType={tax.tax_invoice_type}
                company={tax.client_name}
                date={tax.transaction_date}
                onClick={() => handleTaxClick(tax)}
              />
            ))
          )}
        </div>
      </div>

      {selectedTax && (
        <TaxDetailPanel item={selectedTax} onClose={handleClosePanel} />
      )}
    </>
  );
};

export default Tax;
