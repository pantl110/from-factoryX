'use client';

import { useTranslations } from 'next-intl';
import DocumentViewTitle from '@/app/[locale]/(with-layout)/document/document-view-title';
import MiniBtn from '@/ui/mini-btn';
import OverlayView from '@/ui/ovelay-view';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import DeliveryTableItem from './delivery-table-item';

interface DeliveryDataModel {
  companyName: string;
  productName: string;
  spec: string;
  unit: string;
  quantity: number;
}

interface DeliveryOverlayProps {
  onClose: () => void;
  data: DeliveryDataModel[];
}

const DeliveryOverlay = ({ onClose, data }: DeliveryOverlayProps) => {
  const tCommon = useTranslations('common');
  const tDelivery = useTranslations('production.delivery');
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: tDelivery('title'),
  });

  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        <div className="pb-6 w-full flex justify-between border-b border-lg sticky pt-8 top-0 bg-wh">
          <div>
            <h2 className="Heading-2">{tDelivery('printConfirmTitle')}</h2>
            <div className="mt-2.5 Me_Body-1 text-gr">
              {tDelivery('printConfirmDescription')}
            </div>
          </div>
          <div className="flex gap-2.5">
            <MiniBtn variant="white"
              text={tCommon('cancel')}
              onClick={onClose}
            />
            <MiniBtn variant="primary"
              text={tCommon('print')}
              onClick={reactToPrintFn}
            />
          </div>
        </div>
        <div ref={contentRef}>
          <div className="flex flex-col gap-6">
            {data.map((item, i) => {
              return (
                <div key={i} className="flex flex-col gap-3">
                  {data.length > 1 && (
                    <DocumentViewTitle
                      title={tDelivery('titleWithNumber', { number: i + 1 })}
                    />
                  )}
                  <DeliveryTableItem
                    data={item}
                    isLast={i === data.length - 1}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </OverlayView>
  );
};

export default DeliveryOverlay;
