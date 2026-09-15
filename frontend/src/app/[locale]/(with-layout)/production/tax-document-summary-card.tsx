import { ProjectStatusResponseModel } from '@/types/data-model';
import { useTranslations } from 'next-intl';

interface TaxDocumentSummaryCardProps {
  project: ProjectStatusResponseModel;
}

interface SummaryDocumentModel {
  key: string;
  taxType: 'taxable' | 'exempt' | 'zero_rated';
  itemCount: number;
  supplyAmount: number;
  taxAmount: number;
}

const TaxDocumentSummaryCard = ({ project }: TaxDocumentSummaryCardProps) => {
  const t = useTranslations('production.taxDocumentSummary');
  const tCommon = useTranslations('common');
  const linkedDocuments = project.tax_documents?.length
    ? project.tax_documents
    : project.tax_invoice
      ? [project.tax_invoice]
      : [];

  let documents: SummaryDocumentModel[] = linkedDocuments.map((document) => ({
    key: String(document.id),
    taxType:
      document.tax_type === 'exempt'
        ? 'exempt'
        : document.tax_type === 'zero_rated'
          ? 'zero_rated'
          : 'taxable',
    itemCount: document.line_items?.length || 0,
    supplyAmount: document.transaction_amount || 0,
    taxAmount: document.tax_amount || 0,
  }));

  if (documents.length === 0) {
    const products = project.quotations?.[0]?.products || [];
    const grouped = new Map<'taxable' | 'exempt', SummaryDocumentModel>();
    products.forEach((quotationProduct) => {
      const taxType =
        quotationProduct.product?.tax_type === 'exempt' ? 'exempt' : 'taxable';
      const supplyAmount =
        (quotationProduct.quantity || 0) * (quotationProduct.unit_price || 0);
      const current = grouped.get(taxType) || {
        key: taxType,
        taxType,
        itemCount: 0,
        supplyAmount: 0,
        taxAmount: 0,
      };
      current.itemCount += 1;
      current.supplyAmount += supplyAmount;
      current.taxAmount +=
        taxType === 'taxable' ? Math.floor(supplyAmount * 0.1) : 0;
      grouped.set(taxType, current);
    });
    documents = ['taxable', 'exempt']
      .map((taxType) => grouped.get(taxType as 'taxable' | 'exempt'))
      .filter((document): document is SummaryDocumentModel =>
        Boolean(document)
      );
  }

  if (documents.length === 0) return null;

  const supplyTotal = documents.reduce(
    (sum, document) => sum + document.supplyAmount,
    0
  );
  const taxTotal = documents.reduce(
    (sum, document) => sum + document.taxAmount,
    0
  );
  const itemTotal = documents.reduce(
    (sum, document) => sum + document.itemCount,
    0
  );
  const label = (taxType: SummaryDocumentModel['taxType']) => {
    if (taxType === 'exempt') return t('exemptInvoice');
    if (taxType === 'zero_rated') return t('zeroRatedInvoice');
    return t('taxableInvoice');
  };

  return (
    <section className="mx-10 mt-5 rounded-xl border border-lg bg-wh p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="Sb_Title-3 text-dg">{t('title')}</h3>
          <p className="mt-1 Me_Body-3 text-sv">{t('description')}</p>
        </div>
        <span className="rounded-md bg-blue-8 px-3 py-2 Me_Body-2 text-primary">
          {t('expectedCount', { count: documents.length })}
        </span>
      </div>

      <div className="mt-4 divide-y divide-lg rounded-lg border border-lg">
        <div className="grid grid-cols-[1.4fr_0.6fr_1fr_1fr_1fr] gap-3 bg-bg px-4 py-2 Me_Body-3 text-sv">
          <span>{t('documentType')}</span>
          <span>{t('items')}</span>
          <span className="text-right">{tCommon('supplyAmount')}</span>
          <span className="text-right">{tCommon('taxAmount')}</span>
          <span className="text-right">{tCommon('totalAmount')}</span>
        </div>
        {documents.map((document) => (
          <div
            key={document.key}
            className="grid grid-cols-[1.4fr_0.6fr_1fr_1fr_1fr] items-center gap-3 px-4 py-3 Me_Body-3"
          >
            <strong className="text-dg">{label(document.taxType)}</strong>
            <span className="text-sv">
              {t('itemCount', { count: document.itemCount })}
            </span>
            <span className="text-right text-dg">
              {document.supplyAmount.toLocaleString()}
              {tCommon('won')}
            </span>
            <span className="text-right text-dg">
              {document.taxAmount.toLocaleString()}
              {tCommon('won')}
            </span>
            <strong className="text-right text-dg">
              {(document.supplyAmount + document.taxAmount).toLocaleString()}
              {tCommon('won')}
            </strong>
          </div>
        ))}
        <div className="grid grid-cols-[1.4fr_0.6fr_1fr_1fr_1fr] items-center gap-3 bg-bg px-4 py-3 Me_Body-2">
          <strong className="text-dg">{t('total')}</strong>
          <span className="text-sv">
            {t('itemCount', { count: itemTotal })}
          </span>
          <span className="text-right text-dg">
            {supplyTotal.toLocaleString()}
            {tCommon('won')}
          </span>
          <span className="text-right text-dg">
            {taxTotal.toLocaleString()}
            {tCommon('won')}
          </span>
          <strong className="text-right text-dg">
            {(supplyTotal + taxTotal).toLocaleString()}
            {tCommon('won')}
          </strong>
        </div>
      </div>
    </section>
  );
};

export default TaxDocumentSummaryCard;
