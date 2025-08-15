import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import Panel from '@/ui/panel';
import TaxDocumentView from '@/app/(with-layout)/document/tax-document-view';
import MiniBtn from '@/ui/mini-btn';
import { useGetTaxInvoiceDetail } from '@/hooks';
import { useState, useEffect } from 'react';
import Spinner from '@/ui/spinner';

interface TaxDetailPanelProps {
  itemId: number;
  onClose: () => void;
  isDraft?: boolean;
  onIssueClick?: () => void;
}

const TaxDetailPanel = ({
  itemId,
  onClose,
  isDraft,
  onIssueClick,
}: TaxDetailPanelProps) => {
  const [item, setItem] = useState<PublishedTaxInvoiceResponseModel | null>(
    null
  );
  const { getTaxInvoiceDetail, isLoading } = useGetTaxInvoiceDetail();

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      const result = await getTaxInvoiceDetail(itemId);
      if (result.success && result.data) {
        setItem(result.data);
      }
    };

    fetchData();
  }, [itemId, getTaxInvoiceDetail]);

  // 데이터가 로딩 중이거나 없으면 로딩 표시
  if (isLoading || !item) {
    return (
      <Panel title="세금계산서" onClose={onClose}>
        <div className="flex items-center justify-center h-full">
          <Spinner />
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title={`${item?.tax_invoice_type === 'sales' ? '매출' : '매입'} 세금계산서`}
      onClose={onClose}
      headerButton={
        isDraft &&
        item &&
        ((handleClose) => (
          <div className="flex gap-2 relative">
            <MiniBtn
              text="수정"
              textColor="text-dg"
              borderColor="border-lg"
              hoverColor="hover:bg-bg"
            />
            <MiniBtn
              text="발행"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
              onClick={() => {
                handleClose();
                onIssueClick?.();
              }}
            />
          </div>
        ))
      }
    >
      <TaxDocumentView item={item} />
    </Panel>
  );
};

export default TaxDetailPanel;
