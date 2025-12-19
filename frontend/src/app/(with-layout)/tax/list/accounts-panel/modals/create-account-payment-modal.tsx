import { useMemo, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input, Modal, MiniBtn, Toast } from '@/ui';
import {
  formatDate,
  handleIntegerInput,
  isValidDateString,
  formatISODate,
} from '@/utils';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { useCreatePaymentDetail, useToast } from '@/hooks';
import { WarningCircle } from '@phosphor-icons/react';

interface PaymentFormModel {
  expectedPaymentDate: string;
  paymentDate: string;
  receivedAmount: string;
}

interface CreateAccountPaymentModalProps {
  onClose: () => void;
  account: TaxInvoiceAccountModel | null;
  onSuccess?: () => void;
}

const CreateAccountPaymentModal = ({
  onClose,
  account,
  onSuccess,
}: CreateAccountPaymentModalProps) => {
  // 매입 여부 확인
  const isPurchase = account?.tax_invoice?.tax_invoice_type === 'purchase';

  // account의 약정 입금일을 기본값으로 설정
  const defaultAgreedDate = useMemo(() => {
    if (account?.agreed_payment_date) {
      return formatISODate(account.agreed_payment_date);
    }
    return '';
  }, [account]);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<PaymentFormModel>({
    defaultValues: {
      expectedPaymentDate: defaultAgreedDate,
      paymentDate: defaultAgreedDate,
      receivedAmount: '',
    },
    mode: 'onChange',
  });

  // account의 약정 입금일이 변경되면 폼 값 업데이트
  useEffect(() => {
    reset({
      expectedPaymentDate: defaultAgreedDate,
      paymentDate: defaultAgreedDate,
      receivedAmount: '',
    });
  }, [defaultAgreedDate, reset]);

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
    return currentOutstanding - received;
  }, [account, watchedReceivedAmount]);

  const onError = (errors: any) => {
    // react-hook-form validation 에러 발생 시 토스트 표시
    if (errors.paymentDate) {
      setErrorText(
        isPurchase
          ? '올바른 지급일 형식을 입력해 주세요.'
          : '올바른 입금일 형식을 입력해 주세요.'
      );
      setErrorSubtext('YYYY-MM-DD 형식으로 입력해 주세요.');
      showToast();
    } else if (errors.expectedPaymentDate) {
      setErrorText(
        isPurchase
          ? '올바른 지급예정일 형식을 입력해 주세요.'
          : '올바른 입금예정일 형식을 입력해 주세요.'
      );
      setErrorSubtext('YYYY-MM-DD 형식으로 입력해 주세요.');
      showToast();
    } else if (errors.receivedAmount) {
      setErrorText(
        isPurchase
          ? '지급 금액을 올바르게 입력해 주세요.'
          : '받은 금액을 올바르게 입력해 주세요.'
      );
      setErrorSubtext(errors.receivedAmount.message || '');
      showToast();
    }
  };

  const onSubmit = async (data: PaymentFormModel) => {
    if (!account) {
      setErrorText('계정 정보를 찾을 수 없습니다.');
      showToast();
      return;
    }

    // 날짜 형식 검증 (저장 버튼 클릭 시 토스트 표시 및 input 에러 표시)
    if (!isValidDateString(data.paymentDate)) {
      setError('paymentDate', {
        type: 'manual',
        message: paymentDateError,
      });
      setErrorText(
        isPurchase
          ? '올바른 지급일 형식을 입력해 주세요.'
          : '올바른 입금일 형식을 입력해 주세요.'
      );
      setErrorSubtext('YYYY-MM-DD 형식으로 입력해 주세요.');
      showToast();
      return;
    }

    if (
      data.expectedPaymentDate &&
      data.expectedPaymentDate.trim() !== '' &&
      !isValidDateString(data.expectedPaymentDate)
    ) {
      setError('expectedPaymentDate', {
        type: 'manual',
        message: expectedDateError,
      });
      setErrorText(
        isPurchase
          ? '올바른 지급예정일 형식을 입력해 주세요.'
          : '올바른 입금예정일 형식을 입력해 주세요.'
      );
      setErrorSubtext('YYYY-MM-DD 형식으로 입력해 주세요.');
      showToast();
      return;
    }

    // 지급금액이 미수금액보다 큰지 검증
    if (outstandingBalance < 0) {
      setErrorText(
        isPurchase
          ? '지급 금액이 미지급액보다 큽니다.'
          : '받은 금액이 미수금액보다 큽니다.'
      );
      setErrorSubtext(
        `${
          isPurchase ? '지급 금액' : '받은 금액'
        }은 ${account.outstanding_balance.toLocaleString()}원 이하여야 합니다.`
      );
      showToast();
      return;
    }

    const taxId = account.tax_invoice.id;
    const amountReceived = parseInt(data.receivedAmount.replace(/,/g, '')) || 0;

    const result = await createPaymentDetail(taxId, {
      payment_date: data.paymentDate,
      amount_received: amountReceived,
      outstanding_amount_at_payment: outstandingBalance,
      expected_payment_date:
        data.expectedPaymentDate && data.expectedPaymentDate.trim() !== ''
          ? data.expectedPaymentDate
          : null,
    });

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setErrorText(
        isPurchase
          ? '지급 정보 저장에 실패했습니다.'
          : '입금 정보 저장에 실패했습니다.'
      );
      setErrorSubtext(result.error || '알 수 없는 오류가 발생했습니다.');
      showToast();
    }
  };

  const title = isPurchase ? '지급 정보 입력' : '입금 정보 입력';
  const expectedDateLabel = isPurchase ? '지급예정일' : '입금예정일';
  const paymentDateLabel = isPurchase ? '지급일' : '입금일';
  const amountLabel = isPurchase ? '지급 금액' : '받은 금액';
  const amountPlaceholder = isPurchase
    ? '지급 금액을 입력하세요.'
    : '받은 금액을 입력하세요.';
  const expectedDateError = isPurchase
    ? '올바른 지급예정일 형식을 입력해 주세요.'
    : '올바른 입금예정일 형식을 입력해 주세요.';
  const paymentDateError = isPurchase
    ? '올바른 지급일 형식을 입력해 주세요.'
    : '올바른 입금일 형식을 입력해 주세요.';
  const paymentDateRequired = isPurchase
    ? '지급일을 입력해 주세요.'
    : '입금일을 입력해 주세요.';
  const amountRequired = isPurchase
    ? '지급 금액을 입력해 주세요.'
    : '받은 금액을 입력해 주세요.';
  const amountValidate = isPurchase
    ? '지급 금액은 0보다 커야 합니다.'
    : '받은 금액은 0보다 커야 합니다.';
  const outstandingLabel = isPurchase ? '미지급액(잔액)' : '미수금액(잔액)';

  return (
    <>
      <Modal title={title} onClose={onClose} width="w-[600px]">
        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Controller
              name="expectedPaymentDate"
              control={control}
              rules={{
                validate: (value) => {
                  if (value && value.trim() !== '') {
                    return isValidDateString(value) || expectedDateError;
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <Input
                  label={expectedDateLabel}
                  placeholder="YYYY-MM-DD"
                  value={field.value}
                  onChange={(e) => {
                    const formatted = formatDate(e.target.value);
                    if (formatted.length <= 10) {
                      field.onChange(formatted);
                    }
                  }}
                  showError={!!errors.expectedPaymentDate}
                />
              )}
            />
            <Controller
              name="paymentDate"
              control={control}
              rules={{
                required: paymentDateRequired,
                validate: (value) => {
                  return isValidDateString(value) || paymentDateError;
                },
              }}
              render={({ field }) => (
                <Input
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
                  showError={!!errors.paymentDate}
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
                <Input
                  label={amountLabel}
                  placeholder={amountPlaceholder}
                  type="text"
                  required
                  value={field.value}
                  onChange={(e) => {
                    const { displayValue } = handleIntegerInput(e.target.value);
                    field.onChange(displayValue);
                  }}
                  showError={!!errors.receivedAmount}
                />
              )}
            />
            <Input
              label={outstandingLabel}
              placeholder=""
              disabled
              value={
                outstandingBalance < 0
                  ? '-'
                  : outstandingBalance.toLocaleString()
              }
            />
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <MiniBtn
              text="취소"
              onClick={onClose}
              variant="white"
              type="button"
            />
            <MiniBtn
              text="저장"
              variant="primary"
              disabled={isLoading}
              type="submit"
            />
          </div>
        </form>
      </Modal>

      {/* 에러 토스트 */}
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

export default CreateAccountPaymentModal;
