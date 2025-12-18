import { AccountsStatusType, CollectionTermsType } from '@/types/status-type';
import { IconBtn, InfoLabelValue, MiniBtn, RoundChip } from '@/ui';
import React, { useState, useEffect } from 'react';
import { ArrowLineUpRight, CaretDown } from '@phosphor-icons/react';
import TermDropdown from './term-dropdown';
import { TermType, TERM_LABEL_MAP } from './types';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { formatISODate } from '@/utils';

interface InfoProps {
  handleOpenTaxDetail: () => void;
  isPurchase: boolean;
  projectId?: number | null;
  onOpenLinkProjectModal: () => void;
  account: TaxInvoiceAccountModel | null;
}

const Info = ({
  handleOpenTaxDetail,
  isPurchase,
  projectId,
  onOpenLinkProjectModal,
  account,
}: InfoProps) => {
  const accountsStatus: AccountsStatusType = account?.status ?? 'waiting';

  const [termType, setTermType] = useState<TermType>('INVOICE_30');
  const [customTerm, setCustomTerm] = useState('');
  const [isTermOpen, setIsTermOpen] = useState(false);

  // account 데이터가 로드되면 collection_terms 설정
  useEffect(() => {
    if (account?.collection_terms) {
      if (account.collection_terms === 'CUSTOM') {
        setTermType('CUSTOM');
        setCustomTerm(account.collection_terms_custom || '');
      } else {
        setTermType(account.collection_terms as TermType);
      }
    }
  }, [account]);

  const title = isPurchase ? '매입채무 정보' : '매출채권 정보';
  const statusLabel = isPurchase ? '채무 상태' : '채권 상태';
  const remainLabel = isPurchase ? '미지급금액(잔액)' : '미수금액(잔액)';

  const handleProjectClick = () => {
    if (projectId) {
      window.open(`/production/${projectId}`, '_blank');
    } else {
      onOpenLinkProjectModal();
    }
  };

  const isCustom = termType === 'CUSTOM';
  const displayTerm = isCustom ? customTerm : TERM_LABEL_MAP[termType];

  // 날짜 계산 (약정 입금일까지 남은 일수)
  const getDaysUntilPayment = (dateString: string | null): string | null => {
    if (!dateString) return null;
    const today = new Date();
    const paymentDate = new Date(dateString);
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
    if (diffDays === 0) return 'D-day';
    return `D-${diffDays}`;
  };

  const clientName = account?.tax_invoice?.client_info?.name || '-';
  const totalBilledAmount = account?.total_billed_amount ?? 0;
  const outstandingBalance = account?.outstanding_balance ?? 0;
  const agreedPaymentDate = account?.agreed_payment_date ?? null;
  const daysUntilPayment = getDaysUntilPayment(agreedPaymentDate);
  const notes = account?.notes || '';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <h3 className="Heading-3 h-10 flex items-center">{title}</h3>
        <div className="flex gap-2">
          <MiniBtn
            text="세금계산서 상세보기"
            variant="whiteOutline"
            onClick={handleOpenTaxDetail}
          />
          <MiniBtn
            text={projectId ? '프로젝트 바로가기' : '프로젝트 연결하기'}
            variant="whiteOutline"
            onClick={handleProjectClick}
          />
        </div>
      </div>

      {/* 표 */}
      <div>
        <div className="flex">
          <InfoLabelValue
            label="업체명"
            value={
              <div className="flex items-center gap-2 w-full cursor-pointer">
                <span>{clientName}</span>
                <IconBtn
                  icon={ArrowLineUpRight}
                  size="w-7 h-7"
                  iconSize={18}
                  onClick={() => {}}
                />
              </div>
            }
          />
        </div>

        <div className="flex">
          <InfoLabelValue
            label={statusLabel}
            chip={{ status: accountsStatus }}
          />
          {!isPurchase && (
            <InfoLabelValue
              label="청구서 발송"
              value={
                <RoundChip
                  text={`${account?.invoice_sent_count ?? 0}회 발송`}
                  variant="sm"
                  color={
                    (account?.invoice_sent_count ?? 0) === 0
                      ? 'gray'
                      : 'secondary'
                  }
                />
              }
            />
          )}
        </div>

        <div className="flex">
          <InfoLabelValue
            label="청구금액(합계)"
            value={`${totalBilledAmount.toLocaleString()}원`}
          />
          <InfoLabelValue
            label={remainLabel}
            value={`${outstandingBalance.toLocaleString()}원`}
          />
        </div>

        <div className="flex">
          <div className="relative flex-1">
            <InfoLabelValue
              label={isPurchase ? '지급 조건' : '수금 조건'}
              value={
                <div
                  className="flex items-center justify-between w-full cursor-pointer"
                  onClick={() => setIsTermOpen((prev) => !prev)}
                >
                  {isCustom ? (
                    <input
                      className="flex-1 bg-transparent outline-none"
                      placeholder="직접 입력"
                      value={customTerm}
                      onChange={(e) => setCustomTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate">{displayTerm}</span>
                  )}
                  <CaretDown size={18} className="text-gr" />
                </div>
              }
            />
            {isTermOpen && (
              <div className="absolute right-0 top-full mt-2 z-10">
                <TermDropdown
                  onClose={() => setIsTermOpen(false)}
                  onSelect={(type) => {
                    setIsTermOpen(false);
                    if (type === 'CUSTOM') {
                      setTermType('CUSTOM');
                      setCustomTerm('');
                    } else {
                      setTermType(type);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex-1">
            <InfoLabelValue
              label={isPurchase ? '약정 지급일' : '약정 입금일'}
              value={
                agreedPaymentDate ? (
                  <div className="flex items-center gap-2 w-full">
                    {daysUntilPayment && (
                      <RoundChip
                        text={daysUntilPayment}
                        variant="sm"
                        color="secondary"
                      />
                    )}
                    <span>{formatISODate(agreedPaymentDate)}</span>
                  </div>
                ) : (
                  <span>-</span>
                )
              }
            />
          </div>
        </div>

        <InfoLabelValue
          label="특이사항"
          placeholder="특이사항을 입력하세요."
          value={notes}
        />
      </div>
    </div>
  );
};

export default Info;
