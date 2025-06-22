import ClientInfoTable from "./client-info-table";
import PriceInfo from "@/ui/price-info";
import DetailSalesHeader from "@/app/(with-layout)/tax/tax-detail-panel/detail-sales-header";
import DetailSalesItem from "@/app/(with-layout)/tax/tax-detail-panel/detail-sales-item";
import Panel from "@/ui/panel";

interface TaxDetailPanelProps {
  isPanelOpen: boolean;
  onClose: () => void;
}

const TaxDetailPanel = ({ onClose, isPanelOpen }: TaxDetailPanelProps) => {
  return (
    <Panel title="세무/회계" isPanelOpen={isPanelOpen} onClose={onClose}>
      <div>
        <ClientInfoTable />
        <div>
          <h3 className="Heading-3 text-dg mb-3">주문 품목 정보</h3>
          <PriceInfo />{" "}
        </div>
      </div>
      <div>
        <DetailSalesHeader />
        <DetailSalesItem />
        <DetailSalesItem />
        <DetailSalesItem />
        <DetailSalesItem />
      </div>
    </Panel>
  );
};

export default TaxDetailPanel;
