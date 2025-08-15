import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import Panel from '@/ui/panel';
import TaxDocumentView from '@/app/(with-layout)/document/tax-document-view';

interface TaxDetailPanelProps {
  item: PublishedTaxInvoiceResponseModel;
  onClose: () => void;
  isDraft?: boolean;
  onIssueClick?: () => void;
}

const TaxDetailPanel = ({
  item,
  onClose,
  isDraft,
  onIssueClick,
}: TaxDetailPanelProps) => {
  return (
    <Panel
      title={`${item.tax_invoice_type === 'sales' ? '매출' : '매입'} 세금계산서`}
      onClose={onClose}
      isDraft={isDraft}
      onIssueClick={onIssueClick}
    >
      <TaxDocumentView taxType={item.tax_invoice_type} />
    </Panel>
  );
};

export default TaxDetailPanel;
