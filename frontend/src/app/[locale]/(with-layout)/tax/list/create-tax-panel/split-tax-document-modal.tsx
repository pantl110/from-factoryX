import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import type { TaxSplitPreviewModel } from '@/hooks/tax/use-split-tax-document';
import { useTranslations } from 'next-intl';

interface SplitTaxDocumentModalProps {
  preview: TaxSplitPreviewModel;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const SplitTaxDocumentModal = ({
  preview,
  isLoading,
  onClose,
  onConfirm,
}: SplitTaxDocumentModalProps) => {
  const t = useTranslations('tax.createTaxPanel.splitPreview');
  const tCommon = useTranslations('common');
  const formatAmount = (amount: number) => amount.toLocaleString();

  return (
    <Modal
      title={t('title')}
      subtitle={t('subtitle')}
      onClose={onClose}
      width="w-[620px]"
    >
      <div className="mt-5 flex gap-2">
        {preview.documents.map((document) => (
          <span
            key={`count-${document.tax_type}`}
            className="rounded-md bg-blue-8 px-3 py-2 Me_Body-3 text-primary"
          >
            {document.tax_type === 'taxable'
              ? tCommon('taxable')
              : tCommon('taxExempt')}{' '}
            {document.item_count}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {preview.documents.map((document) => (
          <section
            key={document.tax_type}
            className="rounded-lg border border-lg bg-bg p-4"
          >
            <div className="flex items-center justify-between">
              <strong className="Me_Body-1 text-dg">{document.label}</strong>
              <span className="rounded-md bg-white px-2 py-1 Me_Body-3 text-primary">
                {document.tax_type === 'taxable'
                  ? tCommon('taxable')
                  : tCommon('taxExempt')}
              </span>
            </div>
            <p className="mt-2 Me_Body-3 text-sv">
              {t('itemCount', { count: document.item_count })}
            </p>
            <div className="mt-3 space-y-2">
              {document.line_items?.map((item, index) => (
                <div
                  key={item.id ?? `${document.tax_type}-${index}`}
                  className={`border-l-2 bg-white px-3 py-2 Me_Body-3 text-dg ${
                    document.tax_type === 'exempt'
                      ? 'border-secondary'
                      : 'border-primary'
                  }`}
                >
                  {item.name || '-'}
                </div>
              ))}
            </div>
            <dl className="mt-4 space-y-2 Me_Body-3">
              <div className="flex justify-between">
                <dt className="text-sv">{tCommon('supplyAmount')}</dt>
                <dd className="text-dg">
                  {formatAmount(document.totals.supply_amount)}
                  {tCommon('won')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sv">{tCommon('taxAmount')}</dt>
                <dd className="text-dg">
                  {formatAmount(document.totals.tax_amount)}
                  {tCommon('won')}
                </dd>
              </div>
              <div className="flex justify-between border-t border-lg pt-2">
                <dt className="text-dg">{tCommon('totalAmount')}</dt>
                <dd className="Me_Body-1 text-dg">
                  {formatAmount(document.totals.total_amount)}
                  {tCommon('won')}
                </dd>
              </div>
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-blue-8 px-4 py-3 Me_Body-3 text-dg">
        {preview.is_balanced ? t('balanced') : t('unbalanced')}
      </div>
      <p className="mt-3 Me_Body-3 text-sv">{t('notIssuedNotice')}</p>

      <div className="mt-5 flex justify-end gap-[5px]">
        <MiniBtn
          variant="white"
          text={tCommon('cancel')}
          onClick={onClose}
          disabled={isLoading}
        />
        <MiniBtn
          variant="secondary"
          text={isLoading ? tCommon('loading') : t('confirm')}
          onClick={onConfirm}
          disabled={isLoading || !preview.is_balanced}
        />
      </div>
    </Modal>
  );
};

export default SplitTaxDocumentModal;
