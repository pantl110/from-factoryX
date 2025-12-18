import React, { useState, useEffect } from 'react';
import { IconBtn, MiniBtn, OverlayView, Panel, Spinner } from '@/ui';
import TableArea from './table-area';
import TaxDocumentView from '@/app/(with-layout)/document/tax-document-view';
import { X } from '@phosphor-icons/react';
import { useGetTaxInvoiceAccount } from '@/hooks';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import Info from './info';
import LinkProjectModal from './modals/link-project-modal';
import { DepositorInfoDisplay } from './depositor-info-display';
import { AccountInfoDisplay } from './account-info-display';

interface AccountsPanelProps {
  onClose: () => void;
  itemId: number;
}

const AccountsPanel = ({ onClose, itemId }: AccountsPanelProps) => {
  const [isTaxDetailOpen, setIsTaxDetailOpen] = useState(false);
  const [isLinkProjectModalOpen, setIsLinkProjectModalOpen] = useState(false);
  const [account, setAccount] = useState<TaxInvoiceAccountModel | null>(null);
  const { getTaxInvoiceAccount, isLoading } = useGetTaxInvoiceAccount();

  useEffect(() => {
    const fetchDetail = async () => {
      if (!itemId) return;
      const result = await getTaxInvoiceAccount(itemId);
      if (result.success && result.data) {
        setAccount(result.data);
      }
    };

    fetchDetail();
  }, [itemId, getTaxInvoiceAccount]);

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
      const result = await getTaxInvoiceAccount(itemId);
      if (result.success && result.data) {
        setAccount(result.data);
      }
    }
    setIsLinkProjectModalOpen(false);
  };

  const taxItem = account?.tax_invoice;
  const isPurchase = taxItem?.tax_invoice_type === 'purchase';
  const panelTitle = isPurchase ? '매입채무 관리' : '매출채권 관리';

  return (
    <>
      <Panel
        title={panelTitle}
        onClose={onClose}
        headerButton={<MiniBtn text="저장" variant="secondary" />}
      >
        {isLoading ? (
          <></>
        ) : (
          <div className="flex flex-col gap-10">
            {/* 매출/매입 채권·채무 정보 */}
            <Info
              handleOpenTaxDetail={handleOpenTaxDetail}
              isPurchase={isPurchase}
              projectId={account?.project ?? taxItem?.project_id ?? null}
              onOpenLinkProjectModal={handleOpenLinkProjectModal}
              account={account}
            />

            {/* 입금 확인 정보 (매출) / 지급 계좌 정보 (매입) */}
            {taxItem?.client_info && (
              <>
                {!isPurchase && taxItem.client_info.is_customer && (
                  <DepositorInfoDisplay
                    depositorName={
                      (taxItem.client_info as any).depositor_name || undefined
                    }
                  />
                )}
                {isPurchase && taxItem.client_info.is_supplier && (
                  <AccountInfoDisplay
                    bankName={
                      (taxItem.client_info as any).bank_name || undefined
                    }
                    accountNumber={
                      (taxItem.client_info as any).account_number || undefined
                    }
                    accountHolder={
                      (taxItem.client_info as any).account_holder || undefined
                    }
                  />
                )}
              </>
            )}

            {/* 회수/지급 상세 내역 */}
            <TableArea isPurchase={isPurchase} />
          </div>
        )}
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
