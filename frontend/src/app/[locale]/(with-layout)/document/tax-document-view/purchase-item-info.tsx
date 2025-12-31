'use client';

import { useTranslations } from 'next-intl';
import PriceInfo from '@/ui/price-info';
import PurchaseTableTiem from './purchase-table-tiem';
import { TaxLineItemModel } from '@/types/data-model';

interface PurchaseItemInfoProps {
  lineItems: TaxLineItemModel[];
  transactionAmount: number;
  taxAmount: number;
  canLink?: boolean;
  setIsLinkModalOpen?: (isOpen: boolean) => void;
  setSelectedLineItem?: (lineItem: TaxLineItemModel | null) => void;
}

const PurchaseItemInfo = ({
  lineItems,
  transactionAmount,
  taxAmount,
  canLink,
  setIsLinkModalOpen,
  setSelectedLineItem,
}: PurchaseItemInfoProps) => {
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">
        {tCommon('purchaseMaterialInfo')}
      </h3>

      <div className="w-full cursor-default">
        <div className="flex items-center h-12 w-full border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="px-3 flex-[1.6]">{tCommon('materialName')}</p>
          <p className="px-3 flex-1">{tCommon('specification')}</p>
          <p className="px-3 flex-1">{tCommon('quantity')}</p>
          <p className="px-3 flex-1">{tCommon('unitPrice')}</p>
          <p className={`px-3 ${canLink ? 'flex-[1.5]' : 'flex-1'}`}>
            {tCommon('totalAmount')}
          </p>
          {canLink && <p className="px-3 flex-[1.5]">{tCommon('link')}</p>}
        </div>

        {lineItems.map((lineItem, index) => (
          <PurchaseTableTiem
            key={index}
            lineItem={lineItem}
            canLink={canLink}
            setIsLinkModalOpen={setIsLinkModalOpen}
            setSelectedLineItem={setSelectedLineItem}
          />
        ))}
      </div>

      <PriceInfo
        supplyAmount={transactionAmount}
        taxAmount={taxAmount}
        textColor={'text-red'}
      />
    </div>
  );
};

export default PurchaseItemInfo;
