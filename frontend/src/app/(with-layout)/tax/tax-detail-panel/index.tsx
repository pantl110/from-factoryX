import { TaxDataModel } from "@/mocks/tax-data";
import Panel from "@/ui/panel";
import TaxDocumentView from "@/app/(with-layout)/document/tax-document-view";

interface TaxDetailPanelProps {
  item: TaxDataModel;
  onClose: () => void;
}

const TaxDetailPanel = ({ item, onClose }: TaxDetailPanelProps) => {
  return (
    <Panel title={`${item.taxType} 세금계산서`} onClose={onClose}>
      <TaxDocumentView taxType={item.taxType} />
    </Panel>
  );
};

export default TaxDetailPanel;
