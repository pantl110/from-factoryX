import { AccountsStatusType, CollectionTermsType } from '@/types/status-type';
import { IconBtn, InfoLabelValue, MiniBtn, RoundChip } from '@/ui';
import React, { useState, useEffect } from 'react';
import { ArrowLineUpRight, CaretDown } from '@phosphor-icons/react';
import TermDropdown from './term-dropdown';
import { TermType, TERM_LABEL_MAP } from './types';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { useForm, Controller } from 'react-hook-form';
import { formatISODate, formatDate } from '@/utils';

interface AccountFormModel {
  collection_terms: CollectionTermsType | null;
  collection_terms_custom: string | null;
  agreed_payment_date: string | null;
  notes: string | null;
}

interface InfoProps {
  handleOpenTaxDetail: () => void;
  isPurchase: boolean;
  projectId?: number | null;
  onOpenLinkProjectModal: () => void;
  account: TaxInvoiceAccountModel | null;
  onOpenClientDetailPanel: () => void;
  onIsDirtyChange?: (isDirty: boolean) => void;
}

const Info = ({
  handleOpenTaxDetail,
  isPurchase,
  projectId,
  onOpenLinkProjectModal,
  account,
  onOpenClientDetailPanel,
  onIsDirtyChange,
}: InfoProps) => {
  const accountsStatus: AccountsStatusType = account?.status ?? 'waiting';

  const [isTermOpen, setIsTermOpen] = useState(false);

  const {
    control,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<AccountFormModel>({
    mode: 'onChange',
    defaultValues: {
      collection_terms: null,
      collection_terms_custom: null,
      agreed_payment_date: null,
      notes: null,
    },
  });

  // account 데이터가 로드되면 폼에 기본값 설정
  useEffect(() => {
    if (account) {
      reset({
        collection_terms: account.collection_terms,
        collection_terms_custom: account.collection_terms_custom,
        agreed_payment_date: account.agreed_payment_date,
        notes: account.notes,
      });
    }
  }, [account, reset]);

  // isDirty 상태 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onIsDirtyChange?.(isDirty);
  }, [isDirty, onIsDirtyChange]);

  const watchedCollectionTerms = watch('collection_terms');
  const watchedCustomTerm = watch('collection_terms_custom');
  const watchedAgreedPaymentDate = watch('agreed_payment_date');
  const isCustom = watchedCollectionTerms === 'CUSTOM';
  const displayTerm = isCustom
    ? watchedCustomTerm || ''
    : watchedCollectionTerms
      ? TERM_LABEL_MAP[watchedCollectionTerms as TermType]
      : '';

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

  // 날짜 계산 (약정 입금일까지 남은 일수)
  const getDaysUntilPayment = (dateString: string | null): string | null => {
    if (!dateString) return null;

    const today = new Date();
    const paymentDate = new Date(dateString);

    // 유효하지 않은 날짜인 경우 null 반환
    if (isNaN(paymentDate.getTime())) return null;

    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // NaN이거나 유효하지 않은 숫자인 경우 null 반환
    if (isNaN(diffDays) || !isFinite(diffDays)) return null;

    if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
    return `D-${diffDays}`;
  };

  const clientName = account?.client?.name ?? '-';
  const totalBilledAmount = account?.total_billed_amount ?? 0;
  const outstandingBalance = account?.outstanding_balance ?? 0;
  const daysUntilPayment = getDaysUntilPayment(watchedAgreedPaymentDate);

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
              <div
                className="flex items-center gap-2 w-full cursor-pointer"
                onClick={onOpenClientDetailPanel}
              >
                <span>{clientName}</span>
                <IconBtn
                  icon={ArrowLineUpRight}
                  size="w-7 h-7"
                  iconSize={18}
                  onClick={onOpenClientDetailPanel}
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
                  text={
                    (account?.invoice_sent_count ?? 0) === 0
                      ? '미발송'
                      : `${account?.invoice_sent_count}회 발송`
                  }
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

        <form>
          <div className="flex">
            <div className="relative flex-1">
              <Controller
                name="collection_terms"
                control={control}
                render={({ field }) => (
                  <InfoLabelValue
                    label={isPurchase ? '지급 조건' : '수금 조건'}
                    value={
                      <div
                        className="flex items-center justify-between w-full cursor-pointer"
                        onClick={() => setIsTermOpen((prev) => !prev)}
                      >
                        {isCustom ? (
                          <Controller
                            name="collection_terms_custom"
                            control={control}
                            render={({ field: customField }) => (
                              <input
                                className="flex-1 bg-transparent outline-none"
                                placeholder={
                                  isPurchase
                                    ? '지급 조건을 입력하세요'
                                    : '수금 조건을 입력하세요'
                                }
                                value={customField.value || ''}
                                onChange={(e) => {
                                  customField.onChange(e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          />
                        ) : (
                          <span className="truncate">{displayTerm}</span>
                        )}
                        <CaretDown size={18} className="text-gr" />
                      </div>
                    }
                  />
                )}
              />
              {isTermOpen && (
                <div className="absolute right-0 top-full mt-2 z-10">
                  <TermDropdown
                    onClose={() => setIsTermOpen(false)}
                    onSelect={(type) => {
                      setIsTermOpen(false);
                      if (type === 'CUSTOM') {
                        setValue('collection_terms', 'CUSTOM');
                        setValue('collection_terms_custom', '');
                      } else {
                        setValue(
                          'collection_terms',
                          type as CollectionTermsType
                        );
                        setValue('collection_terms_custom', null);
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Controller
                name="agreed_payment_date"
                control={control}
                render={({ field }) => (
                  <InfoLabelValue
                    label={isPurchase ? '약정 지급일' : '약정 입금일'}
                    value={
                      <div className="flex items-center gap-2 w-full">
                        {field.value && daysUntilPayment && (
                          <RoundChip
                            text={daysUntilPayment}
                            variant="sm"
                            color="secondary"
                          />
                        )}
                        <input
                          type="text"
                          inputMode="numeric"
                          value={field.value ? formatISODate(field.value) : ''}
                          onChange={(e) => {
                            const formatted = formatDate(e.target.value);
                            // YYYY-MM-DD 형식이 완성되면 저장
                            if (formatted.length === 10) {
                              field.onChange(formatted);
                            } else if (formatted.length === 0) {
                              field.onChange(null);
                            }
                          }}
                          onBlur={() => {
                            // 완전한 날짜 형식이 아니면 null로 설정
                            const currentValue = field.value
                              ? formatISODate(field.value)
                              : '';
                            if (currentValue.length !== 10) {
                              field.onChange(null);
                            }
                            field.onBlur();
                          }}
                          placeholder="YYYY-MM-DD"
                          maxLength={10}
                          className="bg-transparent outline-none flex-1"
                          style={{ outline: 'none' }}
                        />
                      </div>
                    }
                  />
                )}
              />
            </div>
          </div>

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="특이사항"
                placeholder="특이사항을 입력하세요."
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value || null)}
                textarea
              />
            )}
          />
        </form>
      </div>
    </div>
  );
};

export default Info;
