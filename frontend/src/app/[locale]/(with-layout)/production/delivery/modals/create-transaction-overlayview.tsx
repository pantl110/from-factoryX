'use client';

import { useTranslations } from 'next-intl';
import TransactionDocumentView from '@/app/[locale]/(with-layout)/document/transaction-document-view';
import { ProjectQuotationModel } from '@/types/data-model';
import MiniBtn from '@/ui/mini-btn';
import OverlayView from '@/ui/ovelay-view';
import getLastDeliveryDate from '@/utils/get-last-delivery-date';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useUpdateProjectStatus } from '@/hooks';
import usePageStatusStore from '@/store/page-status-store';

interface CreateTransactionOverlayviewProps {
  onClose: () => void;
  quotationData: ProjectQuotationModel;
  printedAt: string;
}

const CreateTransactionOverlayview = ({
  onClose,
  quotationData,
  printedAt,
}: CreateTransactionOverlayviewProps) => {
  const tCommon = useTranslations('common');
  const tDocumentType = useTranslations('document.type');
  const tDelivery = useTranslations('production.delivery');
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: tDocumentType('transactionStatementTitle'),
  });

  const { updateProjectStatus } = useUpdateProjectStatus();
  const projectStatus = usePageStatusStore(
    (state) => state.projectStatusData?.status
  );

  const handlePrint = () => {
    reactToPrintFn();
    if (projectStatus && !printedAt) {
      updateProjectStatus(quotationData.project, projectStatus, true);
    }
  };

  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        <div className="pb-6 w-full flex justify-between border-b border-lg sticky pt-8 top-0 bg-wh z-10">
          <div>
            <h2 className="Heading-2">
              {tDelivery('transactionStatementPrintTitle')}
            </h2>
            <div className="mt-2.5 Me_Body-1 text-gr">
              {tDelivery('transactionStatementPrintDescription')}
            </div>
          </div>
          <div className="flex gap-2.5">
            <MiniBtn variant="white"
              text={tCommon('cancel')}
              onClick={onClose}
            />
            <MiniBtn variant="secondary"
              text={tCommon('print')}
              onClick={handlePrint}
            />
          </div>
        </div>

        <div ref={contentRef}>
          <TransactionDocumentView
            quotationData={quotationData}
            lastDeliveryDate={getLastDeliveryDate(quotationData)}
          />
        </div>
      </div>
    </OverlayView>
  );
};

export default CreateTransactionOverlayview;
