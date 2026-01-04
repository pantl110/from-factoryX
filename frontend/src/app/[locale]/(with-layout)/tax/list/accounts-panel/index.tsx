import React, { useState, useEffect, useRef } from 'react';
import { DeleteModal, IconBtn, MiniBtn, OverlayView, Panel, Toast } from '@/ui';
import TableArea from './table-area';
import { WarningCircle, X } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import {
  useGetTaxInvoiceAccount,
  useToast,
  useUpdateTaxInvoiceAccount,
  useSendEmailForAccount,
  useDeletePaymentDetail,
} from '@/hooks';
import {
  TaxInvoiceAccountModel,
  PaymentDetailResponseModel,
} from '@/types/data-model';
import Info, { InfoHandleModel } from './info';
import LinkProjectModal from './modals/link-project-modal';
import CreateAccountPaymentModal from './modals/create-account-payment-modal';
import SendEmail from './modals/send-email-modal';
import { DepositorInfoDisplay } from './depositor-info-display';
import { AccountInfoDisplay } from './account-info-display';
import ClientDetailPanel from '@/app/[locale]/(with-layout)/setting/master-data/client/modals/client-detail-panel';
import TaxDocumentOverlay from '@/app/[locale]/(with-layout)/document/tax-document-overlay';
import ReceiptDetailPanel from '../receipt/modals/receipt-detail-panel';
import { isValidDateString, formatISODate } from '@/utils';

interface AccountsPanelProps {
  onClose: () => void;
  itemId: number;
  type?: 'tax' | 'cash-receipt'; // 기본값: 'tax'
}

const AccountsPanel = ({
  onClose,
  itemId,
  type = 'tax',
}: AccountsPanelProps) => {
  const t = useTranslations('tax.list');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const tDocument = useTranslations('document.taxInvoice');
  // 모달, 판넬 상태
  const [isTaxDetailOpen, setIsTaxDetailOpen] = useState(false);
  const [isCashReceiptDetailOpen, setIsCashReceiptDetailOpen] = useState(false);
  const [isLinkProjectModalOpen, setIsLinkProjectModalOpen] = useState(false);
  const [isClientDetailPanelOpen, setIsClientDetailPanelOpen] = useState(false);
  const [isCreateAccountPaymentModalOpen, setIsCreateAccountPaymentModalOpen] =
    useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [isDeleteAccountPaymentModalOpen, setIsDeleteAccountPaymentModalOpen] =
    useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null
  );
  const [selectedPaymentDetail, setSelectedPaymentDetail] =
    useState<PaymentDetailResponseModel | null>(null);

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
  const { sendEmailForAccount, isLoading: isSendingEmail } =
    useSendEmailForAccount();
  const { deletePaymentDetail, isLoading: isDeletingPayment } =
    useDeletePaymentDetail();
  const infoRef = useRef<InfoHandleModel | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!itemId) return;
      const result = await getTaxInvoiceAccount(itemId, type);
      if (result.success && result.data) {
        setAccount(result.data);
      } else {
        // account가 없으면 null로 설정하여 빈 화면 표시
        setAccount(null);
      }
    };

    fetchDetail();
  }, [itemId, type, getTaxInvoiceAccount]);

  // 세금계산서 상세 판넬 관련 핸들러
  const handleOpenTaxDetail = () => {
    setIsTaxDetailOpen(true);
  };
  const handleCloseTaxDetail = () => {
    setIsTaxDetailOpen(false);
  };

  // 현금영수증 상세 판넬 관련 핸들러
  const handleOpenCashReceiptDetail = () => {
    setIsCashReceiptDetailOpen(true);
  };
  const handleCloseCashReceiptDetail = () => {
    setIsCashReceiptDetailOpen(false);
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
      const result = await getTaxInvoiceAccount(itemId, type);
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
      const result = await getTaxInvoiceAccount(itemId, type);
      if (result.success && result.data) {
        setAccount(result.data);
      }
    }
  };

  // 지급 정보 입력 모달 관련 핸들러
  const handleOpenCreateAccountPaymentModal = () => {
    setSelectedPaymentDetail(null); // 생성 모드
    setIsCreateAccountPaymentModalOpen(true);
  };
  const handleCloseCreateAccountPaymentModal = () => {
    setIsCreateAccountPaymentModalOpen(false);
    setSelectedPaymentDetail(null);
  };

  // 회수/지급 상세내역 수정 모달 관련 핸들러
  const handleOpenEditAccountPaymentModal = (
    paymentDetail: PaymentDetailResponseModel
  ) => {
    setSelectedPaymentDetail(paymentDetail);
    setIsCreateAccountPaymentModalOpen(true);
  };

  // 이메일 보내기 모달 관련 핸들러
  const handleOpenSendEmailModal = () => {
    setIsSendEmailModalOpen(true);
  };
  const handleCloseSendEmailModal = () => {
    setIsSendEmailModalOpen(false);
  };
  const handleSendEmail = async (data: {
    recipient: string;
    subject: string;
    content: string;
  }) => {
    if (!itemId) return;

    const result = await sendEmailForAccount(itemId, data);

    if (result.success && result.data) {
      // 이메일 발송 성공 후 account 정보 다시 불러오기
      const accountResult = await getTaxInvoiceAccount(itemId, type);
      if (accountResult.success && accountResult.data) {
        setAccount(accountResult.data);
      }
      handleCloseSendEmailModal();
    } else if (result.error) {
      setErrorText(t('errors.emailSendFailed'));
      setErrorSubtext(result.error || t('accountPayment.errors.unknownError'));
      showToast();
    }
  };

  // 회수/지급 상세내역 삭제 모달 관련 핸들러
  const handleOpenDeleteAccountPaymentModal = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
    setIsDeleteAccountPaymentModalOpen(true);
  };
  const handleCloseDeleteAccountPaymentModal = () => {
    setIsDeleteAccountPaymentModalOpen(false);
    setSelectedPaymentId(null);
  };
  const handleConfirmDeletePayment = async () => {
    if (!selectedPaymentId) return;

    const result = await deletePaymentDetail(selectedPaymentId);

    if (result.success) {
      // 삭제 성공 후 account 정보 다시 불러오기
      if (itemId) {
        const accountResult = await getTaxInvoiceAccount(itemId, type);
        if (accountResult.success && accountResult.data) {
          setAccount(accountResult.data);
        }
      }
      handleCloseDeleteAccountPaymentModal();
    } else if (result.error) {
      setErrorText(t('errors.deletePaymentDetailFailed'));
      setErrorSubtext(result.error || t('accountPayment.errors.unknownError'));
      showToast();
      handleCloseDeleteAccountPaymentModal();
    }
  };

  const taxItem = account?.tax_invoice;
  const cashReceiptItem = account?.cash_receipt;
  // 현금영수증의 경우 cash_receipt_type을 확인하여 매입 여부 판단
  // 세금계산서의 경우 tax_invoice_type을 확인
  const isPurchase =
    type === 'cash-receipt'
      ? cashReceiptItem?.cash_receipt_type === 'purchase'
      : taxItem?.tax_invoice_type === 'purchase';

  const handleSave = async () => {
    if (!account) return;
    // 세금계산서 또는 현금영수증 ID 확인
    const itemId = type === 'cash-receipt' ? cashReceiptItem?.id : taxItem?.id;
    if (!itemId) return;

    const values = infoRef.current?.getValues();
    if (!values) return;

    // 날짜 형식 검증
    if (values.agreed_payment_date) {
      const dateString = formatISODate(values.agreed_payment_date);
      if (!isValidDateString(dateString)) {
        setErrorText(t('errors.invalidDueDate'));
        setErrorSubtext(t('accountPayment.errors.dateFormat'));
        showToast();
        return;
      }
    }

    // PATCH 요청 시 세금계산서 또는 현금영수증 ID를 path parameter로 전달
    const result = await updateTaxInvoiceAccount(itemId, type, {
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
      setErrorText(t('errors.saveAccountFailed'));
      setErrorSubtext(result.error || t('accountPayment.errors.unknownError'));
      showToast();
    }
  };

  return (
    <>
      <Panel
        title={tNav('taxDropdown.list')}
        onClose={onClose}
        headerButton={
          isFormDirty ? (
            <MiniBtn
              text={tCommon('save')}
              variant="secondary"
              onClick={handleSave}
              disabled={isSaving}
            />
          ) : undefined
        }
      >
        {isLoading || !account ? (
          <></>
        ) : (
          <div className="flex flex-col gap-10">
            {/* 매출/매입 채권·채무 정보 */}
            <Info
              ref={infoRef}
              handleOpenTaxDetail={handleOpenTaxDetail}
              handleOpenCashReceiptDetail={handleOpenCashReceiptDetail}
              isPurchase={isPurchase}
              projectId={
                type === 'cash-receipt' ? null : (taxItem?.project_id ?? null)
              }
              onOpenLinkProjectModal={handleOpenLinkProjectModal}
              account={account}
              onOpenClientDetailPanel={handleOpenClientDetailPanel}
              onIsDirtyChange={setIsFormDirty}
              type={type}
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
              onOpenSendEmailModal={handleOpenSendEmailModal}
              onOpenDeleteAccountPaymentModal={
                handleOpenDeleteAccountPaymentModal
              }
              onOpenEditAccountPaymentModal={handleOpenEditAccountPaymentModal}
              type={type}
            />
          </div>
        )}
      </Panel>

      {/* 세금계산서 상세 판넬 */}
      {isTaxDetailOpen && taxItem && (
        <TaxDocumentOverlay
          onClose={handleCloseTaxDetail}
          item={taxItem}
          title={
            isPurchase
              ? tDocument('purchaseTaxInvoice')
              : tDocument('salesTaxInvoice')
          }
        />
      )}

      {/* 현금영수증 상세 판넬 */}
      {isCashReceiptDetailOpen && cashReceiptItem && (
        <OverlayView onClose={handleCloseCashReceiptDetail}>
          <div className="w-full flex flex-col gap-6 px-8 pb-8">
            {/* top 고정 부위*/}
            <div className="sticky pt-8 top-0 bg-wh">
              <div className="flex justify-between h-13 border-b border-lg">
                <h3 className="Heading-3">{tDocument('cashReceipt')}</h3>
                <IconBtn icon={X} onClick={handleCloseCashReceiptDetail} />
              </div>
            </div>

            <ReceiptDetailPanel
              itemId={cashReceiptItem.id}
              onClose={handleCloseCashReceiptDetail}
              showPanel={false}
            />
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

      {/* 프로젝트 연결 모달 - 세금계산서일 때만 표시 */}
      {isLinkProjectModalOpen && type === 'tax' && (
        <LinkProjectModal
          taxId={itemId}
          onClose={handleCloseLinkProjectModal}
          onSuccess={handleLinkProjectSuccess}
        />
      )}

      {/* 지급 정보 입력/수정 모달 */}
      {isCreateAccountPaymentModalOpen && (
        <CreateAccountPaymentModal
          onClose={handleCloseCreateAccountPaymentModal}
          account={account}
          type={type}
          paymentDetail={selectedPaymentDetail}
          onSuccess={async () => {
            // 지급 정보 저장/수정 후 account 정보 다시 불러오기
            if (itemId) {
              const result = await getTaxInvoiceAccount(itemId, type);
              if (result.success && result.data) {
                setAccount(result.data);
              }
            }
          }}
        />
      )}
      {/* 이메일 보내기 모달 */}
      {isSendEmailModalOpen && (
        <SendEmail
          onClose={handleCloseSendEmailModal}
          account={account}
          onSendEmail={handleSendEmail}
          isLoading={isSendingEmail}
        />
      )}
      {/* 삭제 모달 */}
      {isDeleteAccountPaymentModalOpen && (
        <DeleteModal
          onClose={handleCloseDeleteAccountPaymentModal}
          onDelete={handleConfirmDeletePayment}
          isLoading={isDeletingPayment}
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
