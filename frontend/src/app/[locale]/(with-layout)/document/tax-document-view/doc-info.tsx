'use client';

import { useTranslations } from 'next-intl';
import { InfoLabelValue } from '@/ui';
import { formatISODate } from '@/utils';
import { TaxDocumentType, TransactionType } from '@/types/status-type';

interface DocInfoProps {
  taxType: TaxDocumentType;
  publishDate: string | null;
  transactionType: TransactionType;
}

const DocInfo = ({ taxType, transactionType, publishDate }: DocInfoProps) => {
  const t = useTranslations('tax');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">{t('invoiceInfo')}</h3>
      <div className="width-full border-b border-lg">
        <div className="flex">
          <InfoLabelValue label={t('invoiceType')} chip={{ status: taxType }} />
          <InfoLabelValue
            label={t('type')}
            value={transactionType === 'receipt' ? t('receipt') : t('request')}
          />
        </div>
        <InfoLabelValue
          label={t('issueDate')}
          value={formatISODate(publishDate)}
        />
      </div>
    </div>
  );
};

export default DocInfo;
