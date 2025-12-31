'use client';

import { useTranslations } from 'next-intl';
import OverlayView from '@/ui/ovelay-view';
import TaxDocumentView from './tax-document-view';
import { IconBtn } from '@/ui';
import { X } from '@phosphor-icons/react';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

interface TaxDocumentOverlayProps {
  onClose: () => void;
  taxId?: number;
  item?: PublishedTaxInvoiceResponseModel | null;
  title?: string;
}

const TaxDocumentOverlay = ({
  onClose,
  taxId,
  item,
  title,
}: TaxDocumentOverlayProps) => {
  const tDocumentType = useTranslations('document.type');

  // title이 제공되지 않으면 item의 타입에 따라 기본값 설정
  const defaultTitle =
    item?.tax_invoice_type === 'purchase'
      ? tDocumentType('purchaseTaxInvoice')
      : tDocumentType('salesTaxInvoice');

  const displayTitle = title || defaultTitle;

  if (!taxId && !item) return null;

  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        {/* top 고정 부위 */}
        <div className="sticky pt-8 top-0 bg-wh">
          <div className="flex justify-between h-13 border-b border-lg">
            <h3 className="Heading-3">{displayTitle}</h3>
            <IconBtn icon={X} onClick={onClose} />
          </div>
        </div>

        <TaxDocumentView taxId={taxId} item={item || undefined} />
      </div>
    </OverlayView>
  );
};

export default TaxDocumentOverlay;
