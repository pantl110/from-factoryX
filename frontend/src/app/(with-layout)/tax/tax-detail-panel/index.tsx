import {
  PublishedTaxInvoiceResponseModel,
  TaxLineItemModel,
} from '@/types/data-model';
import Panel from '@/ui/panel';
import TaxDocumentView from '@/app/(with-layout)/document/tax-document-view';
import MiniBtn from '@/ui/mini-btn';
import { useGetTaxInvoiceDetail, useToast } from '@/hooks';
import { useState, useEffect } from 'react';
import Spinner from '@/ui/spinner';
import Toast from '@/ui/toast';
import { CheckCircle } from '@phosphor-icons/react';
import LinkTaxModal from '../../project/process/modals/link-tax-modal/link-tax-modal';

interface TaxDetailPanelProps {
  itemId: number;
  onClose: () => void;
  isDraft?: boolean;
  canLink?: boolean;
}

const TaxDetailPanel = ({
  itemId,
  onClose,
  isDraft,
  canLink,
}: TaxDetailPanelProps) => {
  const [item, setItem] = useState<PublishedTaxInvoiceResponseModel | null>(
    null
  );
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedLineItem, setSelectedLineItem] =
    useState<TaxLineItemModel | null>(null); // 선택한 item을 material history에 연결할 때 사용

  const { getTaxInvoiceDetail, isLoading } = useGetTaxInvoiceDetail();
  const { isToastOpen, isVisible, showToast } = useToast();

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
    <>
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
                  // 판넬이 닫힌 후 토스트 나오기 위해 250ms 딜레이
                  setTimeout(() => {
                    showToast();
                  }, 250);
                }}
              />
            </div>
          ))
        }
      >
        <TaxDocumentView
          item={item}
          canLink={canLink}
          setIsLinkModalOpen={setIsLinkModalOpen}
          setSelectedLineItem={setSelectedLineItem}
        />
      </Panel>

      {canLink && isLinkModalOpen && (
        <LinkTaxModal
          onClose={() => setIsLinkModalOpen(false)}
          linkedItemId={itemId} // 세금계산서 아이디
          type="tax"
          selectedLineItem={selectedLineItem || undefined}
        />
      )}

      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={20} className="text-primary" />}
          text="세금계산서 발행이 완료되었어요."
          subtext="세금계산서는 발행일 기준으로 처리돼요."
          type="primary"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default TaxDetailPanel;
