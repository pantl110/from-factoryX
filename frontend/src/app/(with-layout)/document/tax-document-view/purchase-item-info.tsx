import PriceInfo from '@/ui/price-info';
import PurchaseTableTiem from './purchase-table-tiem';
import {
  PublishedTaxInvoiceResponseModel,
  TaxLineItemModel,
} from '@/types/data-model';

interface PurchaseItemInfoProps {
  lineItems: PublishedTaxInvoiceResponseModel['line_items'];
  transactionAmount: number;
  canLink?: boolean;
  setIsLinkModalOpen?: (isOpen: boolean) => void;
  setSelectedLineItem?: (lineItem: TaxLineItemModel | null) => void;
}

const PurchaseItemInfo = ({
  lineItems,
  transactionAmount,
  canLink,
  setIsLinkModalOpen,
  setSelectedLineItem,
}: PurchaseItemInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">구매 자재 정보</h3>

      <div className="w-full">
        <div className="flex items-center h-12 w-full border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="px-3 flex-2">자재명</p>
          <p className="px-3 flex-2">규격</p>
          <p className="px-3 flex-1">수량</p>
          <p className="px-3 flex-1">단가</p>
          <p className={`px-3 ${canLink ? 'flex-[1.5]' : 'flex-1'}`}>
            공급가액
          </p>
          <p className={`px-3 ${canLink ? 'flex-[1.5]' : 'flex-1'}`}>세액</p>
          {canLink && <p className="px-3 flex-[1.5]">연결하기</p>}
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

      <PriceInfo supplyAmount={transactionAmount} textColor={'text-red'} />
    </div>
  );
};

export default PurchaseItemInfo;
