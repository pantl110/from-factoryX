import React, { useState, useEffect } from 'react';
import { IconBtn, MiniBtn, OverlayView, Panel } from '@/ui';
import TableArea from './table-area';
import TaxDocumentView from '@/app/(with-layout)/document/tax-document-view';
import { X } from '@phosphor-icons/react';
import { useGetTaxInvoiceDetail } from '@/hooks';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import AccountInfo from './account-info';
import Info from './info';
import LinkProjectModal from './modals/link-project-modal';

interface AccountsPanelProps {
  onClose: () => void;
  itemId: number;
}

const AccountsPanel = ({ onClose, itemId }: AccountsPanelProps) => {
  const [isTaxDetailOpen, setIsTaxDetailOpen] = useState(false);
  const [isLinkProjectModalOpen, setIsLinkProjectModalOpen] = useState(false);
  const [taxItem, setTaxItem] =
    useState<PublishedTaxInvoiceResponseModel | null>(null);
  const { getTaxInvoiceDetail } = useGetTaxInvoiceDetail();

  useEffect(() => {
    const fetchDetail = async () => {
      if (!itemId) return;
      const result = await getTaxInvoiceDetail(itemId);
      if (result.success && result.data) {
        setTaxItem(result.data);
      }
    };

    fetchDetail();
  }, [itemId, getTaxInvoiceDetail]);

  // 세금계산서 상세 판넬 관련 핸들러
  const handleOpenTaxDetail = () => {
    setIsTaxDetailOpen(true);
  };
  const handleCloseTaxDetail = () => {
    setIsTaxDetailOpen(false);
  };

  // 프로젝트 연결 모달 관련 핸들러
  const handleOpenLinkProjectModal = () => {
    setIsLinkProjectModalOpen(true);
  };
  const handleCloseLinkProjectModal = () => {
    setIsLinkProjectModalOpen(false);
  };
  const handleLinkProjectSuccess = async () => {
    // 프로젝트 연결 성공 후 세금계산서 정보 다시 불러오기
    if (itemId) {
      const result = await getTaxInvoiceDetail(itemId);
      if (result.success && result.data) {
        setTaxItem(result.data);
      }
    }
    setIsLinkProjectModalOpen(false);
  };

  const isPurchase = taxItem?.tax_invoice_type === 'purchase';
  const panelTitle = isPurchase ? '매입채무 관리' : '매출채권 관리';

  return (
    <>
      <Panel
        title={panelTitle}
        onClose={onClose}
        headerButton={<MiniBtn text="저장" variant="secondary" />}
      >
        <div className="flex flex-col gap-10">
          {/* 매출 세금계산서 */}
          {/* <TaxDetail onOpenDetail={handleOpenDetail} /> */}

          {/* 매출/매입 채권·채무 정보 */}
          <Info
            handleOpenTaxDetail={handleOpenTaxDetail}
            isPurchase={isPurchase}
            projectId={taxItem?.project_id || null}
            onOpenLinkProjectModal={handleOpenLinkProjectModal}
          />

          {/* 거래처 계좌 정보 - 매입일 때만 표시 */}
          {isPurchase && <AccountInfo />}

          {/* 회수/지급 상세 내역 */}
          <TableArea isPurchase={isPurchase} />
        </div>
      </Panel>

      {/* 세금계산서 상세 판넬 */}
      {isTaxDetailOpen && taxItem && (
        <OverlayView onClose={handleCloseTaxDetail}>
          <div className="w-full flex flex-col gap-6 px-8 pb-8">
            {/* top 고정 부위*/}
            <div className="sticky pt-8 top-0 bg-wh">
              <div className="flex justify-between h-13 border-b border-lg">
                <h3 className="Heading-3">매출 세금계산서</h3>
                <IconBtn icon={X} onClick={handleCloseTaxDetail} />
              </div>
            </div>

            <TaxDocumentView item={taxItem} />
          </div>
        </OverlayView>
      )}

      {/* 프로젝트 연결 모달 */}
      {isLinkProjectModalOpen && (
        <LinkProjectModal
          taxId={itemId}
          onClose={handleCloseLinkProjectModal}
          onSuccess={handleLinkProjectSuccess}
        />
      )}
    </>
  );
};

export default AccountsPanel;
