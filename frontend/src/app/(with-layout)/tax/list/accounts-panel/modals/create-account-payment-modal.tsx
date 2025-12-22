import { useMemo, useState, useEffect } from 'react';
import { useForm, Controller, FieldErrors } from 'react-hook-form';
import { Input, Modal, MiniBtn, Toast } from '@/ui';
import {
  formatDate,
  handleIntegerInput,
  isValidDateString,
  formatISODate,
  getToday,
} from '@/utils';
import {
  TaxInvoiceAccountModel,
  PaymentDetailResponseModel,
} from '@/types/data-model';
import {
  useCreatePaymentDetail,
  useUpdatePaymentDetail,
  useToast,
} from '@/hooks';
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
  type?: 'tax' | 'cash-receipt';
  paymentDetail?: PaymentDetailResponseModel | null; // 수정 모드일 때 전달
}

const CreateAccountPaymentModal = ({
  onClose,
  account,
  onSuccess,
  type = 'tax',
  paymentDetail = null,
}: CreateAccountPaymentModalProps) => {
  const isEditMode = !!paymentDetail;

  // 매입 여부 확인
  const isPurchase =
    type === 'cash-receipt'
      ? account?.cash_receipt?.cash_receipt_type === 'purchase'
      : account?.tax_invoice?.tax_invoice_type === 'purchase';

  // 수정 모드일 때는 paymentDetail의 값 사용, 생성 모드일 때는 account의 약정 입금일 사용
  const defaultAgreedDate = useMemo(() => {
    if (isEditMode && paymentDetail?.expected_payment_date) {
      return formatISODate(paymentDetail.expected_payment_date);
    }
    if (account?.agreed_payment_date) {
      return formatISODate(account.agreed_payment_date);
    }
    return '';
  }, [isEditMode, paymentDetail, account]);

  // 수정 모드일 때는 paymentDetail의 지급일 사용, 생성 모드일 때는 오늘 날짜 사용
  const defaultPaymentDate = useMemo(() => {
    if (isEditMode && paymentDetail?.payment_date) {
      return formatISODate(paymentDetail.payment_date);
    }
    return getToday();
  }, [isEditMode, paymentDetail]);

  // 수정 모드일 때는 paymentDetail의 금액 사용
  const defaultAmount = useMemo(() => {
    if (isEditMode && paymentDetail?.amount_received) {
      return paymentDetail.amount_received.toLocaleString();
    }
    return '';
  }, [isEditMode, paymentDetail]);

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
      paymentDate: defaultPaymentDate,
      receivedAmount: defaultAmount,
    },
    mode: 'onChange',
  });

  // 값이 변경되면 폼 업데이트
  useEffect(() => {
    reset({
      expectedPaymentDate: defaultAgreedDate,
      paymentDate: defaultPaymentDate,
      receivedAmount: defaultAmount,
    });
  }, [defaultAgreedDate, defaultPaymentDate, defaultAmount, reset]);

  const { createPaymentDetail, isLoading: isCreating } =
    useCreatePaymentDetail();
  const { updatePaymentDetail, isLoading: isUpdating } =
    useUpdatePaymentDetail();
  const isLoading = isCreating || isUpdating;
  const { showToast, isToastOpen, isVisible } = useToast();
  const [errorText, setErrorText] = useState('');
  const [errorSubtext, setErrorSubtext] = useState('');

  const watchedReceivedAmount = watch('receivedAmount');

  // 받은 금액에 따라 미수금액(잔액) 자동 계산
  // 수정 모드일 때는 기존 금액을 고려해야 함
  const outstandingBalance = useMemo(() => {
    if (!account) return 0;
    const currentOutstanding = account.outstanding_balance || 0;
    const received = watchedReceivedAmount
      ? parseInt(watchedReceivedAmount.replace(/,/g, '')) || 0
      : 0;

    if (isEditMode && paymentDetail) {
      // 수정 모드: 기존 금액을 빼고 새 금액을 더함
      const oldAmount = paymentDetail.amount_received || 0;
      return currentOutstanding + oldAmount - received;
    }

    // 생성 모드: 새 금액만 뺌
    return currentOutstanding - received;
  }, [account, watchedReceivedAmount, isEditMode, paymentDetail]);

  const onError = (errors: FieldErrors<PaymentFormModel>) => {
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
      if (errors.expectedPaymentDate.type === 'required') {
        setErrorText(
          isPurchase
            ? '약정 지급일을 입력해 주세요.'
            : '약정 입금일을 입력해 주세요.'
        );
        setErrorSubtext('');
      } else {
        setErrorText(
          isPurchase
            ? '올바른 약정 지급일 형식을 입력해 주세요.'
            : '올바른 약정 입금일 형식을 입력해 주세요.'
        );
        setErrorSubtext('YYYY-MM-DD 형식으로 입력해 주세요.');
      }
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

    if (!isValidDateString(data.expectedPaymentDate)) {
      setError('expectedPaymentDate', {
        type: 'manual',
        message: expectedDateError,
      });
      setErrorText(
        isPurchase
          ? '올바른 약정 지급일 형식을 입력해 주세요.'
          : '올바른 약정 입금일 형식을 입력해 주세요.'
      );
      setErrorSubtext('YYYY-MM-DD 형식으로 입력해 주세요.');
      showToast();
      return;
    }

    // 지급금액이 미수금액보다 큰지 검증
    if (outstandingBalance < 0) {
      setError('receivedAmount', {
        type: 'manual',
        message: `${
          isPurchase ? '지급 금액' : '받은 금액'
        }은 ${account.outstanding_balance.toLocaleString()}원 이하여야 합니다.`,
      });
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

    const amountReceived = parseInt(data.receivedAmount.replace(/,/g, '')) || 0;

    let result;
    if (isEditMode && paymentDetail) {
      // 수정 모드
      result = await updatePaymentDetail(paymentDetail.id, {
        payment_date: data.paymentDate,
        amount_received: amountReceived,
        expected_payment_date: data.expectedPaymentDate,
      });
    } else {
      // 생성 모드
      const taxId =
        type === 'cash-receipt'
          ? account.cash_receipt?.id
          : account.tax_invoice?.id;
      if (!taxId) return;

      result = await createPaymentDetail(taxId, type, {
        payment_date: data.paymentDate,
        amount_received: amountReceived,
        expected_payment_date: data.expectedPaymentDate,
      });
    }

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setErrorText(
        isPurchase
          ? isEditMode
            ? '지급 정보 수정에 실패했습니다.'
            : '지급 정보 저장에 실패했습니다.'
          : isEditMode
            ? '입금 정보 수정에 실패했습니다.'
            : '입금 정보 저장에 실패했습니다.'
      );
      setErrorSubtext(result.error || '알 수 없는 오류가 발생했습니다.');
      showToast();
    }
  };

  const title = isPurchase
    ? isEditMode
      ? '지급 정보 수정'
      : '지급 정보 입력'
    : isEditMode
      ? '입금 정보 수정'
      : '입금 정보 입력';
  const expectedDateLabel = isPurchase ? '약정 지급일' : '약정 입금일';
  const paymentDateLabel = isPurchase ? '지급일' : '입금일';
  const amountLabel = isPurchase ? '지급 금액' : '받은 금액';
  const amountPlaceholder = isPurchase
    ? '지급 금액을 입력하세요.'
    : '받은 금액을 입력하세요.';
  const expectedDateError = isPurchase
    ? '올바른 약정 지급일 형식을 입력해 주세요.'
    : '올바른 약정 입금일 형식을 입력해 주세요.';
  const paymentDateError = isPurchase
    ? '올바른 지급일 형식을 입력해 주세요.'
    : '올바른 입금일 형식을 입력해 주세요.';
  const paymentDateRequired = isPurchase
    ? '지급일을 입력해 주세요.'
    : '입금일을 입력해 주세요.';
  const expectedDateRequired = isPurchase
    ? '약정 지급일을 입력해 주세요.'
    : '약정 입금일을 입력해 주세요.';
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
                required: expectedDateRequired,
                validate: (value) => {
                  return isValidDateString(value) || expectedDateError;
                },
              }}
              render={({ field }) => (
                <Input
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
