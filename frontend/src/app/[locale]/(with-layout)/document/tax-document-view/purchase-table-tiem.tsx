'use client';

import { useTranslations } from 'next-intl';
import {
  PublishedTaxInvoiceResponseModel,
  TaxLineItemModel,
} from '@/types/data-model';
import MiniBtn from '@/ui/mini-btn';
import useMemberStore from '@/store/member-store';

interface PurchaseTableTiemProps {
  lineItem: PublishedTaxInvoiceResponseModel['line_items'][number];
  canLink?: boolean;
  setIsLinkModalOpen?: (isOpen: boolean) => void;
  setSelectedLineItem?: (lineItem: TaxLineItemModel | null) => void;
}

const PurchaseTableTiem = ({
  lineItem,
  canLink,
  setIsLinkModalOpen,
  setSelectedLineItem,
}: PurchaseTableTiemProps) => {
  const tList = useTranslations('tax.list');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  return (
    <div className="h-14 w-full flex items-center Me_Body-3 text-dg border-b border-lg">
      <p className="flex-[1.6] px-3 truncate" title={lineItem.name}>
        {lineItem.name}
      </p>
      <p className="flex-1 px-3 truncate" title={lineItem.information}>
        {lineItem.information}
      </p>
      <p
        className="flex-1 px-3 truncate"
        title={Number(lineItem.chargeable_unit).toLocaleString()}
      >
        {Number(lineItem.chargeable_unit).toLocaleString()}
      </p>
      <p
        className="flex-1 px-3 truncate"
        title={Number(lineItem.unit_price).toLocaleString()}
      >
        {Number(lineItem.unit_price).toLocaleString()}
      </p>
      <p
        className="flex-1 px-3 truncate"
        title={(
          Number(lineItem.amount) + Number(lineItem.tax)
        ).toLocaleString()}
      >
        {(Number(lineItem.amount) + Number(lineItem.tax)).toLocaleString()}
      </p>
      {canLink && (
        <div className="px-3 flex-[1.9]">
          <MiniBtn variant="outline"
            text={tList('tableHeader.projectLink.purchase')}
            onClick={() => {
              setIsLinkModalOpen?.(true);
              setSelectedLineItem?.(lineItem);
            }}
            disabled={
              isViewer || !!(lineItem as TaxLineItemModel).material_history
            }
            height="h-8"
          />
        </div>
      )}
    </div>
  );
};

export default PurchaseTableTiem;
