import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useTaxDocumentGroupReadiness, {
  TaxDocumentGroupReadinessModel,
} from '@/hooks/tax/use-tax-document-group-readiness';
import useSplitTaxDocument from '@/hooks/tax/use-split-tax-document';

interface TaxDocumentGroupModalProps {
  documents: PublishedTaxInvoiceResponseModel[];
  onClose: () => void;
  onSelect: (taxId: number) => void;
  onUpdated?: () => void | Promise<void>;
}

const TaxDocumentGroupModal = ({
  documents,
  onClose,
  onSelect,
  onUpdated,
}: TaxDocumentGroupModalProps) => {
  const t = useTranslations('project.taxDocumentGroup');
  const tTaxStatus = useTranslations('tax.publishStatus');
  const tCommon = useTranslations('common');
  const { checkReadiness, isLoading: isReadinessLoading } =
    useTaxDocumentGroupReadiness();
  const {
    splitGroupDocument,
    resetSplitGroup,
    isLoading: isSplitLoading,
  } = useSplitTaxDocument();
  const [readiness, setReadiness] =
    useState<TaxDocumentGroupReadinessModel | null>(null);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [splitTargetId, setSplitTargetId] = useState<number | null>(null);
  const [selectedLineIndexes, setSelectedLineIndexes] = useState<number[]>([]);
  const [splitError, setSplitError] = useState<string | null>(null);
  const client = documents[0]?.client_info;
  const supplyTotal = documents.reduce(
    (sum, document) => sum + (document.transaction_amount || 0),
    0
  );
  const taxTotal = documents.reduce(
    (sum, document) => sum + (document.tax_amount || 0),
    0
  );
  const canResetToAutoSplit =
    documents.length > 2 &&
    documents.every((document) => document.publish_status === 'temporary');

  const handleCheckReadiness = async () => {
    const sourceId = documents[0]?.id;
    if (!sourceId) return;
    setReadinessError(null);
    const result = await checkReadiness(sourceId);
    if (result.success && result.data) {
      setReadiness(result.data);
    } else {
      setReadiness(null);
      setReadinessError(result.error || t('readinessError'));
    }
  };

  const toggleLineItem = (index: number) => {
    setSelectedLineIndexes((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  };

  const handleAdditionalSplit = async (
    documentId: number,
    expectedLineItemCount: number
  ) => {
    setSplitError(null);
    const result = await splitGroupDocument(
      documentId,
      selectedLineIndexes,
      expectedLineItemCount
    );
    if (!result.success) {
      setSplitError(result.error || t('additionalSplitError'));
      return;
    }
    await onUpdated?.();
    onClose();
  };

  const handleResetSplit = async () => {
    const sourceId = documents[0]?.id;
    if (!sourceId || !window.confirm(t('resetConfirm'))) return;
    setSplitError(null);
    const result = await resetSplitGroup(sourceId);
    if (!result.success) {
      setSplitError(result.error || t('resetError'));
      return;
    }
    await onUpdated?.();
    onClose();
  };

  const getDocumentLabel = (document: PublishedTaxInvoiceResponseModel) => {
    if (document.tax_type === 'exempt') return t('exemptInvoice');
    if (document.tax_type === 'zero_rated') return t('zeroRatedInvoice');
    return t('taxableInvoice');
  };

  const getStatusLabel = (
    status: PublishedTaxInvoiceResponseModel['publish_status']
  ) => {
    if (!status) return '-';
    if (status === 'temporary') return tTaxStatus('temporary');
    if (status === 'pending') return tTaxStatus('pending');
    if (status === 'processing') return tTaxStatus('processing');
    if (status === 'published') return tTaxStatus('published');
    if (status === 'failed') return tTaxStatus('failed');
    if (status === 'cancled') return tTaxStatus('cancled');
    return status;
  };

  return (
    <Modal
      title={t('title')}
      subtitle={t('subtitle', { count: documents.length })}
      onClose={onClose}
      width="w-[720px]"
    >
      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg border border-lg Me_Body-3">
        <div className="border-b border-r border-lg bg-bg px-4 py-3 text-sv">
          {t('clientName')}
        </div>
        <div className="border-b border-lg px-4 py-3 text-dg">
          {client?.name || '-'}
        </div>
        <div className="border-b border-r border-lg bg-bg px-4 py-3 text-sv">
          {t('businessNumber')}
        </div>
        <div className="border-b border-lg px-4 py-3 text-dg">
          {client?.business_registration_number || '-'}
        </div>
        <div className="border-r border-lg bg-bg px-4 py-3 text-sv">
          {t('documentCount')}
        </div>
        <div className="px-4 py-3 text-dg">
          {t('countValue', { count: documents.length })}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {documents.map((document) => {
          const lineItems = document.line_items || [];
          const isSplitTarget = splitTargetId === document.id;
          const canSplitDocument =
            document.publish_status === 'temporary' && lineItems.length > 1;
          return (
            <div
              key={document.id}
              className="rounded-lg border border-lg bg-bg px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="Me_Body-1 text-dg">
                      {getDocumentLabel(document)}
                    </strong>
                    <span className="rounded-md bg-white px-2 py-1 Me_Body-3 text-primary">
                      {getStatusLabel(document.publish_status)}
                    </span>
                  </div>
                  <p className="mt-2 Me_Body-3 text-sv">
                    {t('itemCount', { count: lineItems.length })} ·{' '}
                    {tCommon('supplyAmount')}{' '}
                    {(document.transaction_amount || 0).toLocaleString()}
                    {tCommon('won')} · {tCommon('taxAmount')}{' '}
                    {(document.tax_amount || 0).toLocaleString()}
                    {tCommon('won')} · {tCommon('totalAmount')}{' '}
                    {(
                      (document.transaction_amount || 0) +
                      (document.tax_amount || 0)
                    ).toLocaleString()}
                    {tCommon('won')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {canSplitDocument && (
                    <MiniBtn
                      variant="outline"
                      text={t('additionalSplit')}
                      onClick={() => {
                        setSplitTargetId(isSplitTarget ? null : document.id);
                        setSelectedLineIndexes([]);
                        setSplitError(null);
                      }}
                    />
                  )}
                  <MiniBtn
                    variant="outline"
                    text={t('view')}
                    onClick={() => onSelect(document.id)}
                  />
                </div>
              </div>

              {isSplitTarget && (
                <div className="mt-3 rounded-md border border-lg bg-white p-3">
                  <p className="Me_Body-3 text-dg">{t('selectItemsToMove')}</p>
                  <div className="mt-2 space-y-2">
                    {lineItems.map((item, index) => (
                      <label
                        key={`${document.id}-${index}`}
                        className="flex cursor-pointer items-center gap-2 rounded-md bg-bg px-3 py-2 Me_Body-3 text-dg"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLineIndexes.includes(index)}
                          onChange={() => toggleLineItem(index)}
                        />
                        <span className="flex-1">{item.name || '-'}</span>
                        <span className="text-sv">
                          {(
                            Number(item.amount) + Number(item.tax)
                          ).toLocaleString()}
                          {tCommon('won')}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-sv">{t('leaveOneItem')}</p>
                  <div className="mt-3 flex justify-end gap-1">
                    <MiniBtn
                      variant="white"
                      text={tCommon('cancel')}
                      onClick={() => {
                        setSplitTargetId(null);
                        setSelectedLineIndexes([]);
                      }}
                    />
                    <MiniBtn
                      variant="secondary"
                      text={
                        isSplitLoading
                          ? tCommon('loading')
                          : t('createAdditionalDocument')
                      }
                      disabled={
                        isSplitLoading ||
                        selectedLineIndexes.length === 0 ||
                        selectedLineIndexes.length >= lineItems.length
                      }
                      onClick={() =>
                        handleAdditionalSplit(document.id, lineItems.length)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-bg px-4 py-3 Me_Body-2 text-dg">
        <span>{t('grandTotal')}</span>
        <span>
          {tCommon('supplyAmount')} {supplyTotal.toLocaleString()}
          {tCommon('won')} · {tCommon('taxAmount')} {taxTotal.toLocaleString()}
          {tCommon('won')} · {tCommon('totalAmount')}{' '}
          {(supplyTotal + taxTotal).toLocaleString()}
          {tCommon('won')}
        </span>
      </div>

      <div className="mt-4 rounded-lg bg-red-4 px-4 py-3 Me_Body-3 text-red">
        <strong className="block Me_Body-2">{t('irreversibleTitle')}</strong>
        <p className="mt-1">{t('irreversibleDescription')}</p>
      </div>

      {readiness && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 Me_Body-3 ${
            readiness.can_publish ? 'bg-blue-8 text-dg' : 'bg-red-4 text-red'
          }`}
        >
          <strong className="block Me_Body-2">
            {readiness.can_publish
              ? t('readinessComplete')
              : t('readinessBlocked')}
          </strong>
          <ul className="mt-2 space-y-1">
            {readiness.documents.map((document) => (
              <li key={document.id}>
                {document.tax_type === 'exempt'
                  ? t('exemptInvoice')
                  : document.tax_type === 'zero_rated'
                    ? t('zeroRatedInvoice')
                    : t('taxableInvoice')}
                : {document.message}
              </li>
            ))}
          </ul>
          <p className="mt-2">{t('noExternalRequest')}</p>
        </div>
      )}

      {readinessError && (
        <p className="mt-4 rounded-lg bg-red-4 px-4 py-3 Me_Body-3 text-red">
          {readinessError}
        </p>
      )}

      {splitError && (
        <p className="mt-4 rounded-lg bg-red-4 px-4 py-3 Me_Body-3 text-red">
          {splitError}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-[5px]">
        <div>
          {canResetToAutoSplit && (
            <MiniBtn
              variant="outline"
              text={t('resetToAutoSplit')}
              onClick={handleResetSplit}
              disabled={isSplitLoading}
            />
          )}
        </div>
        <div className="flex gap-[5px]">
          <MiniBtn variant="white" text={tCommon('close')} onClick={onClose} />
          <MiniBtn
            variant="secondary"
            text={isReadinessLoading ? tCommon('loading') : t('checkReadiness')}
            onClick={handleCheckReadiness}
            disabled={isReadinessLoading || isSplitLoading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TaxDocumentGroupModal;
