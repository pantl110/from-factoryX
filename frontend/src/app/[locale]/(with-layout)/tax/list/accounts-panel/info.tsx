import { AccountsStatusType, CollectionTermsType } from '@/types/status-type';
import { IconBtn, InfoLabelValue, MiniBtn, RoundChip } from '@/ui';
import React, { useState, useEffect, useImperativeHandle } from 'react';
import { ArrowLineUpRight, CaretDown } from '@phosphor-icons/react';
import TermDropdown from './term-dropdown';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { useForm, Controller } from 'react-hook-form';
import {
  formatISODate,
  formatDate,
  getDaysUntilPayment,
  getAgreedPaymentDateByCollectionTerm,
} from '@/utils';
import { useTranslations } from 'next-intl';

interface AccountFormModel {
  collection_terms: CollectionTermsType | null;
  collection_terms_custom: string | null;
  agreed_payment_date: string | null;
  notes: string | null;
}

interface InfoProps {
  handleOpenTaxDetail: () => void;
  handleOpenCashReceiptDetail: () => void;
  isPurchase: boolean;
  projectId?: number | null;
  onOpenLinkProjectModal: () => void;
  account: TaxInvoiceAccountModel | null;
  onOpenClientDetailPanel: () => void;
  onIsDirtyChange?: (isDirty: boolean) => void;
  onOpenSendEmailModal?: () => void;
  type?: 'tax' | 'cash-receipt';
}

export interface InfoHandleModel {
  getValues: () => AccountFormModel;
}

const Info = React.forwardRef<InfoHandleModel, InfoProps>(
  (
    {
      handleOpenTaxDetail,
      handleOpenCashReceiptDetail,
      isPurchase,
      projectId,
      onOpenLinkProjectModal,
      account,
      onOpenClientDetailPanel,
      onIsDirtyChange,
      onOpenSendEmailModal,
      type = 'tax',
    },
    ref
  ) => {
    const t = useTranslations('tax.list.info');
    const tCommon = useTranslations('common');
    const tAccountPayment = useTranslations('tax.list.accountPayment.labels');
    const tLinkProject = useTranslations('tax.list.linkProjectModal');
    const tTableArea = useTranslations('tax.list.tableArea');
    const accountsStatus: AccountsStatusType = account?.status ?? 'waiting';

    const [isTermOpen, setIsTermOpen] = useState(false);

    const {
      control,
      watch,
      setValue,
      reset,
      getValues,
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

    useImperativeHandle(
      ref,
      () => ({
        getValues: () => getValues(),
      }),
      [getValues]
    );

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
    const getTermLabel = (term: CollectionTermsType | null): string => {
      if (!term || term === 'CUSTOM') return '';
      if (term === 'INVOICE_30') return t('terms.invoice30');
      if (term === 'INVOICE_EOM_NEXT') return t('terms.invoiceEomNext');
      return '';
    };
    const displayTerm = isCustom
      ? watchedCustomTerm || ''
      : getTermLabel(watchedCollectionTerms);

    const title = isPurchase ? t('title.purchase') : t('title.sales');
    const statusLabel = isPurchase
      ? t('statusLabel.purchase')
      : t('statusLabel.sales');
    const remainLabel = isPurchase
      ? t('labels.amountPayable')
      : t('labels.amountReceivable');

    const handleProjectClick = () => {
      if (projectId) {
        window.open(`/production/${projectId}`, '_blank');
      } else {
        onOpenLinkProjectModal();
      }
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
            {type === 'tax' && (
              <MiniBtn
                text={t('buttons.viewTaxInvoice')}
                variant="whiteOutline"
                onClick={handleOpenTaxDetail}
              />
            )}
            {type === 'cash-receipt' && (
              <MiniBtn
                text={t('buttons.viewCashReceipt')}
                variant="whiteOutline"
                onClick={handleOpenCashReceiptDetail}
              />
            )}
            {!isPurchase && (
              <MiniBtn
                text={
                  projectId
                    ? t('buttons.goToProject')
                    : tLinkProject('linkButton')
                }
                variant="whiteOutline"
                onClick={handleProjectClick}
              />
            )}
          </div>
        </div>

        {/* 표 */}
        <div>
          <div className="flex">
            <InfoLabelValue
              label={tCommon('clientName')}
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
                label={t('labels.invoiceSent')}
                value={
                  <div className="flex w-full justify-between items-center">
                    <RoundChip
                      text={
                        (account?.invoice_sent_count ?? 0) === 0
                          ? t('invoiceSent.notSent')
                          : t('invoiceSent.sentCount', {
                              count: account?.invoice_sent_count ?? 0,
                            })
                      }
                      variant="sm"
                      color={
                        (account?.invoice_sent_count ?? 0) === 0
                          ? 'gray'
                          : 'secondary'
                      }
                    />
                    {onOpenSendEmailModal && (
                      <MiniBtn
                        text={tTableArea('buttons.sendEmail')}
                        variant="whiteOutline"
                        onClick={onOpenSendEmailModal}
                        disabled={account?.status === 'completed'}
                      />
                    )}
                  </div>
                }
              />
            )}
          </div>
          <div className="flex">
            <InfoLabelValue
              label={t('labels.totalBilledAmount')}
              value={`${totalBilledAmount.toLocaleString()}원`}
            />
            <InfoLabelValue
              label={remainLabel}
              value={`${outstandingBalance.toLocaleString()}원`}
            />
          </div>
          <form>
            <div className="flex">
              <div className="relative flex-1 min-w-0">
                <Controller
                  name="collection_terms"
                  control={control}
                  render={() => (
                    <InfoLabelValue
                      label={t('labels.collectionTerms')}
                      value={
                        <div
                          className="flex items-center justify-between w-full cursor-pointer gap-2"
                          onClick={() => setIsTermOpen((prev) => !prev)}
                        >
                          <div className="flex-1 min-w-0">
                            {isCustom ? (
                              <Controller
                                name="collection_terms_custom"
                                control={control}
                                render={({ field: customField }) => (
                                  <input
                                    className="w-full bg-transparent outline-none break-words"
                                    placeholder={
                                      isPurchase
                                        ? t(
                                            'placeholders.collectionTerms.purchase.term'
                                          ) +
                                          t(
                                            'placeholders.collectionTerms.purchase.input'
                                          )
                                        : t(
                                            'placeholders.collectionTerms.sales.term'
                                          ) +
                                          t(
                                            'placeholders.collectionTerms.sales.input'
                                          )
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
                              <span
                                className={`break-words ${
                                  !watchedCollectionTerms ? 'text-gr' : ''
                                }`}
                              >
                                {displayTerm ||
                                  (isPurchase
                                    ? t(
                                        'placeholders.collectionTerms.purchase.term'
                                      ) +
                                      t(
                                        'placeholders.collectionTerms.purchase.select'
                                      )
                                    : t(
                                        'placeholders.collectionTerms.sales.term'
                                      ) +
                                      t(
                                        'placeholders.collectionTerms.sales.select'
                                      ))}
                              </span>
                            )}
                          </div>
                          <CaretDown
                            size={18}
                            className="text-gr flex-shrink-0"
                          />
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
                          return;
                        }

                        const term = type as CollectionTermsType;
                        setValue('collection_terms', term);
                        setValue('collection_terms_custom', null);

                        const baseDateString =
                          account?.tax_invoice?.updated_at ?? null;
                        const autoDate = getAgreedPaymentDateByCollectionTerm(
                          term,
                          baseDateString
                        );
                        if (autoDate) {
                          setValue('agreed_payment_date', autoDate);
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
                      label={
                        isPurchase
                          ? tAccountPayment('expectedPaymentDate')
                          : tAccountPayment('expectedDepositDate')
                      }
                      value={
                        <div className="flex items-center gap-2 w-full">
                          {field.value && daysUntilPayment && (
                            <RoundChip
                              text={daysUntilPayment}
                              variant="sm"
                              color={
                                daysUntilPayment === 'D-0' ||
                                daysUntilPayment.startsWith('D+')
                                  ? 'red'
                                  : 'secondary'
                              }
                            />
                          )}
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              field.value ? formatISODate(field.value) : ''
                            }
                            onChange={(e) => {
                              const formatted = formatDate(e.target.value);
                              // 입력 중에도 값을 반영하고, 빈 값이면 null 처리
                              field.onChange(
                                formatted.length > 0 ? formatted : null
                              );
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

            <div className="border-b border-lg">
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <InfoLabelValue
                    label={tCommon('note')}
                    placeholder={tCommon('note') + '을 입력하세요.'}
                    value={field.value || ''}
                    isEditing
                    textarea
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                )}
              />
            </div>
          </form>
        </div>
      </div>
    );
  }
);

Info.displayName = 'Info';

export default Info;
