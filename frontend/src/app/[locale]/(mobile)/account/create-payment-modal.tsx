'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useForm, Controller, FieldErrors } from 'react-hook-form';
import { MoModal, MoInput, MoBtn, MoToast } from '@/ui';
import {
  formatDate,
  handleIntegerInput,
  isValidDateString,
  formatISODate,
  getToday,
} from '@/utils';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { useCreatePaymentDetail, useToast } from '@/hooks';
import { WarningCircle } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

interface PaymentFormModel {
  expectedPaymentDate: string;
  paymentDate: string;
  receivedAmount: string;
}

interface CreatePaymentModalProps {
  onClose: () => void;
  account: TaxInvoiceAccountModel | null;
  type?: 'tax' | 'cash-receipt';
  onSuccess?: () => void;
}

const CreatePaymentModal = ({
  onClose,
  account,
  type = 'tax',
  onSuccess,
}: CreatePaymentModalProps) => {
  const t = useTranslations('tax.list.accountPayment');
  const tCommon = useTranslations('common');

  // 매입 여부 확인
  const isPurchase =
    type === 'cash-receipt'
      ? account?.cash_receipt?.cash_receipt_type === 'purchase'
      : account?.tax_invoice?.tax_invoice_type === 'purchase';

  // 약정 입금일 기본값
  const defaultAgreedDate = useMemo(() => {
    if (account?.agreed_payment_date) {
      return formatISODate(account.agreed_payment_date);
    }
    return '';
  }, [account]);

  // 지급일 기본값 (오늘 날짜)
  const defaultPaymentDate = useMemo(() => {
    return getToday();
  }, []);

  const { control, handleSubmit, watch, reset, setError } =
    useForm<PaymentFormModel>({
      defaultValues: {
        expectedPaymentDate: defaultAgreedDate,
        paymentDate: defaultPaymentDate,
        receivedAmount: '',
      },
      mode: 'onChange',
    });

  // 값이 변경되면 폼 업데이트
  useEffect(() => {
    reset({
      expectedPaymentDate: defaultAgreedDate,
      paymentDate: defaultPaymentDate,
      receivedAmount: '',
    });
  }, [defaultAgreedDate, defaultPaymentDate, reset]);

  const { createPaymentDetail, isLoading } = useCreatePaymentDetail();
  const { showToast, isToastOpen, isVisible } = useToast();
  const [errorText, setErrorText] = useState('');
  const [errorSubtext, setErrorSubtext] = useState('');

  const watchedReceivedAmount = watch('receivedAmount');

  // 받은 금액에 따라 미수금액(잔액) 자동 계산
  const outstandingBalance = useMemo(() => {
    if (!account) return 0;
    const currentOutstanding = account.outstanding_balance || 0;
    const received = watchedReceivedAmount
      ? parseInt(watchedReceivedAmount.replace(/,/g, '')) || 0
      : 0;

    // 생성 모드: 새 금액만 뺌
    return currentOutstanding - received;
  }, [account, watchedReceivedAmount]);

  const onError = (errors: FieldErrors<PaymentFormModel>) => {
    // react-hook-form validation 에러 발생 시 토스트 표시
    if (errors.paymentDate) {
      setErrorText(
        isPurchase
          ? t('errors.paymentDateInvalid')
          : t('errors.depositDateInvalid')
      );
      setErrorSubtext(t('errors.dateFormat'));
      showToast();
    } else if (errors.expectedPaymentDate) {
      if (errors.expectedPaymentDate.type === 'required') {
        setErrorText(
          isPurchase
            ? t('errors.expectedPaymentDateRequired')
            : t('errors.expectedDepositDateRequired')
        );
        setErrorSubtext('');
      } else {
        setErrorText(
          isPurchase
            ? t('errors.expectedPaymentDateInvalid')
            : t('errors.expectedDepositDateInvalid')
        );
        setErrorSubtext(t('errors.dateFormat'));
      }
      showToast();
    } else if (errors.receivedAmount) {
      setErrorText(
        isPurchase
          ? t('errors.paymentAmountInvalid')
          : t('errors.receivedAmountInvalid')
      );
      setErrorSubtext(errors.receivedAmount.message || '');
      showToast();
    }
  };

  const onSubmit = async (data: PaymentFormModel) => {
    if (!account) {
      setErrorText(t('errors.accountNotFound'));
      showToast();
      return;
    }

    // 날짜 형식 검증
    const paymentDateErrorMsg = isPurchase
      ? t('errors.paymentDateInvalid')
      : t('errors.depositDateInvalid');
    if (!isValidDateString(data.paymentDate)) {
      setError('paymentDate', {
        type: 'manual',
        message: paymentDateErrorMsg,
      });
      setErrorText(paymentDateErrorMsg);
      setErrorSubtext(t('errors.dateFormat'));
      showToast();
      return;
    }

    const expectedDateErrorMsg = isPurchase
      ? t('errors.expectedPaymentDateInvalid')
      : t('errors.expectedDepositDateInvalid');
    if (!isValidDateString(data.expectedPaymentDate)) {
      setError('expectedPaymentDate', {
        type: 'manual',
        message: expectedDateErrorMsg,
      });
      setErrorText(expectedDateErrorMsg);
      setErrorSubtext(t('errors.dateFormat'));
      showToast();
      return;
    }

    // 지급금액이 미수금액보다 큰지 검증
    if (outstandingBalance < 0) {
      const maxAmountMsg = isPurchase
        ? t('errors.paymentAmountMax', {
            amount: account.outstanding_balance.toLocaleString(),
          })
        : t('errors.receivedAmountMax', {
            amount: account.outstanding_balance.toLocaleString(),
          });
      setError('receivedAmount', {
        type: 'manual',
        message: maxAmountMsg,
      });
      setErrorText(
        isPurchase
          ? t('errors.paymentAmountExceeds')
          : t('errors.receivedAmountExceeds')
      );
      setErrorSubtext(maxAmountMsg);
      showToast();
      return;
    }

    const amountReceived = parseInt(data.receivedAmount.replace(/,/g, '')) || 0;

    // 생성 모드
    const taxId =
      type === 'cash-receipt'
        ? account.cash_receipt?.id
        : account.tax_invoice?.id;
    if (!taxId) {
      setErrorText(t('errors.accountNotFound'));
      setErrorSubtext(t('errors.documentIdNotFound'));
      showToast();
      return;
    }

    const result = await createPaymentDetail(taxId, type, {
      payment_date: data.paymentDate,
      amount_received: amountReceived,
      expected_payment_date: data.expectedPaymentDate,
    });

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setErrorText(
        isPurchase
          ? t('errors.createPaymentFailed')
          : t('errors.createDepositFailed')
      );
      setErrorSubtext(result.error || t('errors.unknownError'));
      showToast();
    }
  };

  const title = isPurchase
    ? t('title.createPayment')
    : t('title.createDeposit');
  const expectedDateLabel = isPurchase
    ? t('labels.expectedPaymentDate')
    : t('labels.expectedDepositDate');
  const paymentDateLabel = isPurchase
    ? t('labels.paymentDate')
    : t('labels.depositDate');
  const amountLabel = isPurchase
    ? t('labels.paymentAmount')
    : t('labels.receivedAmount');
  const amountPlaceholder = isPurchase
    ? t('placeholders.paymentAmount')
    : t('placeholders.receivedAmount');
  const paymentDateRequired = isPurchase
    ? t('errors.paymentDateRequired')
    : t('errors.depositDateRequired');
  const expectedDateRequired = isPurchase
    ? t('errors.expectedPaymentDateRequired')
    : t('errors.expectedDepositDateRequired');
  const amountRequired = isPurchase
    ? t('errors.paymentAmountRequired')
    : t('errors.receivedAmountRequired');
  const amountValidate = isPurchase
    ? t('errors.paymentAmountMin')
    : t('errors.receivedAmountMin');
  const outstandingLabel = isPurchase
    ? t('labels.outstandingPayment')
    : t('labels.outstandingDeposit');

  return (
    <>
      <MoModal title={title} onClose={onClose}>
        <form id="payment-form" onSubmit={handleSubmit(onSubmit, onError)}>
          <div className="flex flex-col gap-5">
            <Controller
              name="expectedPaymentDate"
              control={control}
              rules={{
                required: expectedDateRequired,
                validate: (value) => {
                  const errorMsg = isPurchase
                    ? t('errors.expectedPaymentDateInvalid')
                    : t('errors.expectedDepositDateInvalid');
                  return isValidDateString(value) || errorMsg;
                },
              }}
              render={({ field }) => (
                <MoInput
                  label={expectedDateLabel}
                  placeholder="YYYY-MM-DD"
                  required
                  value={field.value}
                  onChange={(e) => {
                    const formatted = formatDate(e.target.value);
                    if (formatted.length <= 10) {
                      field.onChange(formatted);
                    }
                  }}
                />
              )}
            />
            <Controller
              name="paymentDate"
              control={control}
              rules={{
                required: paymentDateRequired,
                validate: (value) => {
                  const errorMsg = isPurchase
                    ? t('errors.paymentDateInvalid')
                    : t('errors.depositDateInvalid');
                  return isValidDateString(value) || errorMsg;
                },
              }}
              render={({ field }) => (
                <MoInput
                  label={paymentDateLabel}
                  placeholder="YYYY-MM-DD"
                  required
                  value={field.value}
                  onChange={(e) => {
                    const formatted = formatDate(e.target.value);
                    if (formatted.length <= 10) {
                      field.onChange(formatted);
                    }
                  }}
                />
              )}
            />
            <Controller
              name="receivedAmount"
              control={control}
              rules={{
                required: amountRequired,
                validate: (value) => {
                  const amount = parseInt(value.replace(/,/g, '')) || 0;
                  return amount > 0 || amountValidate;
                },
              }}
              render={({ field }) => (
                <MoInput
                  label={amountLabel}
                  placeholder={amountPlaceholder}
                  required
                  value={field.value}
                  onChange={(e) => {
                    const { displayValue } = handleIntegerInput(e.target.value);
                    field.onChange(displayValue);
                  }}
                />
              )}
            />
            <div className="flex flex-col gap-2">
              <label className="m-Body-2 text-sv">{outstandingLabel}</label>
              <div className="w-full h-12 min-h-9 rounded-[4px] px-3 flex items-center m-Body-2 bg-bg text-dg border border-lg">
                {outstandingBalance < 0
                  ? '-'
                  : outstandingBalance.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-6">
            <MoBtn
              text={tCommon('save')}
              onClick={() => {
                const form = document.getElementById(
                  'payment-form'
                ) as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              variant="primary"
              disabled={isLoading}
              width="w-full"
              big={true}
            />
            <MoBtn
              text={tCommon('cancel')}
              onClick={onClose}
              variant="outline"
              width="w-full"
              big={true}
            />
          </div>
        </form>
      </MoModal>

      {/* 에러 토스트 */}
      {isToastOpen && (
        <MoToast
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

export default CreatePaymentModal;
