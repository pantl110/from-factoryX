'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import MiniBtn from '@/ui/mini-btn';
import TaxDetailPanel from '@/app/[locale]/(with-layout)/tax/tax-detail-panel';
import { TaxDocumentType } from '@/types/status-type';
import NoHistoryBox from '@/ui/no-history-box';
import TaxItem from './tax-item';

interface TaxInvoiceItemModel {
  id: number;
  tax_invoice_type: TaxDocumentType;
  client_info?: { name?: string };
  transaction_date: string;
}

interface TaxProps {
  taxInvoicesData: TaxInvoiceItemModel[];
  isLoading: boolean;
}

const Tax = ({ taxInvoicesData, isLoading }: TaxProps) => {
  const t = useTranslations('dashboard.tax');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [selectedTax, setSelectedTax] = useState<TaxInvoiceItemModel | null>(
    null
  );

  const handleTaxClick = (tax: TaxInvoiceItemModel) => {
    setSelectedTax(tax);
  };

  const handleClosePanel = () => {
    setSelectedTax(null);
  };

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0 gap-3">
        <div className="flex items-center justify-between">
          <h3 className="Heading-3">{t('title')}</h3>
          <MiniBtn variant="outline"
            text={tCommon('more')}
            onClick={() => {
              router.push('/tax/list');
            }}
          />
        </div>
        <div className="flex flex-col gap-3">
          {isLoading || taxInvoicesData.length === 0 ? (
            <NoHistoryBox
              title={t('noInvoice')}
              text={t('noInvoiceDescription')}
            />
          ) : (
            taxInvoicesData.map((tax) => (
              <TaxItem
                key={tax.id}
                taxType={tax.tax_invoice_type}
                company={tax.client_info?.name || '-'}
                date={tax.transaction_date}
                onClick={() => handleTaxClick(tax)}
              />
            ))
          )}
        </div>
      </div>

      {selectedTax && (
        <TaxDetailPanel itemId={selectedTax.id} onClose={handleClosePanel} />
      )}
    </>
  );
};

export default Tax;
