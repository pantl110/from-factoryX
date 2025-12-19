import React, { useState, useEffect, useRef } from 'react';
import { IconBtn, MiniBtn, OverlayView, Panel, Toast } from '@/ui';
import TableArea from './table-area';
import TaxDocumentView from '@/app/(with-layout)/document/tax-document-view';
import { WarningCircle, X } from '@phosphor-icons/react';
import {
  useGetTaxInvoiceAccount,
  useToast,
  useUpdateTaxInvoiceAccount,
} from '@/hooks';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import Info, { InfoHandleModel } from './info';
import LinkProjectModal from './modals/link-project-modal';
import CreateAccountPaymentModal from './modals/create-account-payment-modal';
import { DepositorInfoDisplay } from './depositor-info-display';
import { AccountInfoDisplay } from './account-info-display';
import ClientDetailPanel from '@/app/(with-layout)/setting/master-data/client/modals/client-detail-panel';
import { isValidDateString, formatISODate } from '@/utils';

interface AccountsPanelProps {
  onClose: () => void;
  itemId: number;
}

const AccountsPanel = ({ onClose, itemId }: AccountsPanelProps) => {
  // 모달, 판넬 상태
  const [isTaxDetailOpen, setIsTaxDetailOpen] = useState(false);
  const [isLinkProjectModalOpen, setIsLinkProjectModalOpen] = useState(false);
  const [isClientDetailPanelOpen, setIsClientDetailPanelOpen] = useState(false);
  const [isCreateAccountPaymentModalOpen, setIsCreateAccountPaymentModalOpen] =
    useState(false);

  // 데이터 상태
  const [account, setAccount] = useState<TaxInvoiceAccountModel | null>(null);

  // 토스트 상태
  const { showToast, isToastOpen, isVisible } = useToast();
  const [errorText, setErrorText] = useState('');
  const [errorSubtext, setErrorSubtext] = useState('');

  // 폼 상태
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { getTaxInvoiceAccount, isLoading } = useGetTaxInvoiceAccount();
  const { updateTaxInvoiceAccount, isLoading: isSaving } =
    useUpdateTaxInvoiceAccount();
  const infoRef = useRef<InfoHandleModel | null>(null);

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

  // 거래처 상세 판넬 관련 핸들러
  const handleOpenClientDetailPanel = () => {
    setIsClientDetailPanelOpen(true);
  };
  const handleCloseClientDetailPanel = () => {
    setIsClientDetailPanelOpen(false);
  };
  const handleRefetchClient = async () => {
    // 거래처 정보 업데이트 후 세금계산서 정보 다시 불러오기
    if (itemId) {
      const result = await getTaxInvoiceAccount(itemId);
      if (result.success && result.data) {
        setAccount(result.data);
      }
    }
  };

  // 지급 정보 입력 모달 관련 핸들러
  const handleOpenCreateAccountPaymentModal = () => {
    setIsCreateAccountPaymentModalOpen(true);
  };
  const handleCloseCreateAccountPaymentModal = () => {
    setIsCreateAccountPaymentModalOpen(false);
  };

  const taxItem = account?.tax_invoice;
  const isPurchase = taxItem?.tax_invoice_type === 'purchase';

  const handleSave = async () => {
    if (!account || !taxItem) return;
    const values = infoRef.current?.getValues();
    if (!values) return;

    // 날짜 형식 검증
    if (values.agreed_payment_date) {
      const dateString = formatISODate(values.agreed_payment_date);
      if (!isValidDateString(dateString)) {
        setErrorText('유효한 납기일자를 입력해 주세요.');
        setErrorSubtext('YYYY-MM-DD 형식으로 입력해 주세요.');
        showToast();
        return;
      }
    }

    // PATCH 요청 시 세금계산서 account 번호가 아닌
    // 세금계산서 id(tax id)를 path parameter로 전달
    const result = await updateTaxInvoiceAccount(taxItem.id, {
      collection_terms: values.collection_terms,
      collection_terms_custom: values.collection_terms_custom,
      agreed_payment_date: values.agreed_payment_date,
      notes: values.notes,
    });

    if (result.success && result.data) {
      setAccount(result.data);
      setIsFormDirty(false);
      onClose();
    } else if (result.error) {
      setErrorText('세금계산서 채권/채무 정보 저장에 실패했습니다.');
      setErrorSubtext(result.error || '알 수 없는 오류가 발생했습니다.');
      showToast();
    }
  };

  return (
    <>
      <Panel
        title="채권 · 채무 관리"
        onClose={onClose}
        headerButton={
          isFormDirty ? (
            <MiniBtn
              text="저장"
              variant="secondary"
              onClick={handleSave}
              disabled={isSaving}
            />
          ) : undefined
        }
      >
        {isLoading ? (
          <></>
        ) : (
          <div className="flex flex-col gap-10">
            {/* 매출/매입 채권·채무 정보 */}
            <Info
              ref={infoRef}
              handleOpenTaxDetail={handleOpenTaxDetail}
              isPurchase={isPurchase}
              projectId={taxItem?.project_id ?? null}
              onOpenLinkProjectModal={handleOpenLinkProjectModal}
              account={account}
              onOpenClientDetailPanel={handleOpenClientDetailPanel}
              onIsDirtyChange={setIsFormDirty}
            />

            {/* 입금 확인 정보 (매출) / 지급 계좌 정보 (매입) */}
            {account?.client && (
              <>
                {!isPurchase && account.client.is_customer && (
                  <DepositorInfoDisplay
                    depositorName={account.client.depositor_name || undefined}
                  />
                )}
                {isPurchase && account.client.is_supplier && (
                  <AccountInfoDisplay
                    bankName={account.client.bank_name || undefined}
                    accountNumber={account.client.account_number || undefined}
                    accountHolder={account.client.account_holder || undefined}
                  />
                )}
              </>
            )}

            {/* 회수/지급 상세 내역 */}
            <TableArea
              isPurchase={isPurchase}
              taxId={itemId}
              account={account}
              onOpenCreateAccountPaymentModal={
                handleOpenCreateAccountPaymentModal
              }
            />
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

      {/* 거래처 상세 판넬 */}
      {isClientDetailPanelOpen && account?.client && (
        <ClientDetailPanel
          clientId={account.client.id}
          onClose={handleCloseClientDetailPanel}
          refetchClient={handleRefetchClient}
        />
      )}

      {/* 프로젝트 연결 모달 */}
      {isLinkProjectModalOpen && (
        <LinkProjectModal
          taxId={itemId}
          onClose={handleCloseLinkProjectModal}
          onSuccess={handleLinkProjectSuccess}
        />
      )}

      {/* 지급 정보 입력 모달 */}
      {isCreateAccountPaymentModalOpen && (
        <CreateAccountPaymentModal
          onClose={handleCloseCreateAccountPaymentModal}
          account={account}
          onSuccess={async () => {
            // 지급 정보 저장 후 account 정보 다시 불러오기
            if (itemId) {
              const result = await getTaxInvoiceAccount(itemId);
              if (result.success && result.data) {
                setAccount(result.data);
              }
            }
          }}
        />
      )}
      {/* 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text={errorText}
          subtext={errorSubtext}
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default AccountsPanel;
