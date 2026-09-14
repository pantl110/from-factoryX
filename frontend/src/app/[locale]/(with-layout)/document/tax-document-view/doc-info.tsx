'use client';

import { useTranslations } from 'next-intl';
import { InfoLabelValue } from '@/ui';
import { formatISODate } from '@/utils';
import { TaxDocumentType, TaxType, TransactionType } from '@/types/status-type';

interface DocInfoProps {
  taxType: TaxDocumentType;
  taxClassification: TaxType;
  zeroRatedReason?: string | null;
  publishDate: string | null;
  transactionType: TransactionType;
}

const DocInfo = ({
  taxType,
  taxClassification,
  zeroRatedReason,
  transactionType,
  publishDate,
}: DocInfoProps) => {
  const t = useTranslations('tax');
  const tCreate = useTranslations('tax.createTaxPanel');
  const tCommon = useTranslations('common');

  const taxClassificationLabel =
    taxClassification === 'zero_rated'
      ? tCreate('taxType.zeroRated')
      : taxClassification === 'exempt'
        ? tCreate('taxType.exempt')
        : taxClassification === 'taxable'
          ? tCreate('taxType.taxable')
          : tCreate('taxType.unclassified');

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
        <div className="flex">
          <InfoLabelValue
            label={tCreate('taxType.label')}
            value={taxClassificationLabel}
          />
          {taxClassification === 'zero_rated' && (
            <InfoLabelValue
              label={tCreate('taxType.zeroRatedReasonLabel')}
              value={zeroRatedReason || '-'}
            />
          )}
        </div>
        <InfoLabelValue
          label={tCommon('issuedDate')}
          value={formatISODate(publishDate)}
        />
      </div>
    </div>
  );
};

export default DocInfo;
