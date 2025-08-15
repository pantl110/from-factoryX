import { TaxDocumentType } from '@/types/status-type';
import OrderItemInfo from './order-item-info';
import PurchaseItemInfo from './purchase-item-info';
import TaxBuyerProviderInfo from './tax-buyer-provider-info';

interface TaxDocumentViewProps {
  taxType?: TaxDocumentType;
}

const TaxDocumentView = ({ taxType }: TaxDocumentViewProps) => {
  return (
    <div className="flex flex-col gap-6">
      {taxType && <TaxBuyerProviderInfo taxType={taxType} />}
      {taxType === 'sales' && <OrderItemInfo />}
      {taxType === 'purchase' && <PurchaseItemInfo />}
    </div>
  );
};

export default TaxDocumentView;
