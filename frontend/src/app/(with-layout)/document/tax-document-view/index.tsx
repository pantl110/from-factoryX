import OrderItemInfo from "./order-item-info";
import PurchaseItemInfo from "./purchase-item-info";
import TaxBuyerProviderInfo from "./tax-buyer-provider-info";

interface TaxDocumentViewProps {
  taxType?: string;
}

const TaxDocumentView = ({ taxType }: TaxDocumentViewProps) => {
  return (
    <div className="flex flex-col gap-6">
      {taxType === "매출" && <TaxBuyerProviderInfo taxType="매출" />}
      {taxType === "매입" && <TaxBuyerProviderInfo taxType="매입" />}
      {taxType === "매출" && <OrderItemInfo />}
      {taxType === "매입" && <PurchaseItemInfo />}
    </div>
  );
};

export default TaxDocumentView;
