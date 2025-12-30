import { Input, MiniBtn } from '@/ui';
import Modal from '@/ui/modal/modal';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import { useGetFactory } from '@/hooks';

interface EmailFormModel {
  recipient: string;
  subject: string;
  content: string;
}

interface SendEmailModalProps {
  onClose: () => void;
  account: TaxInvoiceAccountModel | null;
  onSendEmail: (data: EmailFormModel) => void;
  isLoading?: boolean;
}

const SendEmailModal = ({
  onClose,
  account,
  onSendEmail,
  isLoading = false,
}: SendEmailModalProps) => {
  const clientName = account?.client?.name || '';
  const clientEmail = account?.client?.email || '';
  const factoryId = useMemberStore((state) => state.factoryId);
  const { getFactory, factory } = useGetFactory();

  // 공장 정보 가져오기
  useEffect(() => {
    if (factoryId) {
      getFactory(factoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  // 현재 달 가져오기
  const currentMonth = useMemo(() => {
    return new Date().getMonth() + 1;
  }, []);

  // 공장 이름 가져오기
  const factoryName = factory?.name || '';

  // 약정입금일 그대로 사용
  const paymentDate = useMemo(() => {
    return account?.agreed_payment_date || '';
  }, [account?.agreed_payment_date]);

  // 청구금액 포맷팅
  const formattedAmount = useMemo(() => {
    const amount = account?.total_billed_amount ?? 0;
    return amount.toLocaleString();
  }, [account?.total_billed_amount]);

  // 이메일 내용 템플릿 생성
  const emailContent = useMemo(() => {
    return `안녕하세요. ${clientName} 담당자님.
    
${currentMonth}월 정산 금액 관련하여 입금 요청드립니다.
해당 건의 세금계산서 발행은 완료되었으며, 정산 금액은 아래와 같습니다.

정산금액: ${formattedAmount}원
입금기한: ${paymentDate}

기한 내 입금이 어려우시거나 금액 관련 문의가 있으시면
편하게 연락 부탁드립니다.

감사합니다.`;
  }, [clientName, currentMonth, paymentDate, formattedAmount]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailFormModel>({
    defaultValues: {
      recipient: clientEmail || '',
      subject: factoryName
        ? `[${factoryName}] ${currentMonth}월 정산 금액 입금 요청드립니다`
        : `${currentMonth}월 정산 금액 입금 요청드립니다`,
      content: emailContent,
    },
    mode: 'onChange',
  });

  // account가 변경되면 받는 사람 필드 업데이트
  useEffect(() => {
    reset({
      recipient: clientEmail || '',
      subject: factoryName
        ? `[${factoryName}] ${currentMonth}월 정산 금액 입금 요청드립니다`
        : `${currentMonth}월 정산 금액 입금 요청드립니다`,
      content: emailContent,
    });
  }, [clientEmail, currentMonth, emailContent, factoryName, reset]);

  const onSubmit = (data: EmailFormModel) => {
    onSendEmail(data);
  };

  return (
    <Modal
      title="메일 보내기"
      subtitle="담당자에게 청구 관련 안내 메일을 발송합니다."
      onClose={onClose}
      width="w-[600px]"
      scroll
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col max-h-[calc(85vh-109px)] overflow-y-auto scrollbar-hide">
          <div className="mt-4 px-6">
            <div className="flex flex-col gap-5">
              <Controller
                name="recipient"
                control={control}
                rules={{
                  required: '받는 사람을 입력해 주세요.',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '올바른 이메일 형식을 입력해 주세요.',
                  },
                }}
                render={({ field }) => {
                  const handleRecipientChange = (
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => {
                    field.onChange(e);
                  };
                  const handleRecipientBlur = (
                    _e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => {
                    field.onBlur();
                  };
                  return (
                    <Input
                      label="받는 사람"
                      placeholder="이메일을 입력하세요."
                      value={field.value}
                      onChange={handleRecipientChange}
                      onBlur={handleRecipientBlur}
                      showError={!!errors.recipient}
                      errorMessage={errors.recipient?.message}
                      required
                    />
                  );
                }}
              />
              <Controller
                name="subject"
                control={control}
                rules={{
                  required: '제목을 입력해 주세요.',
                }}
                render={({ field }) => {
                  const handleSubjectChange = (
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => {
                    field.onChange(e);
                  };
                  const handleSubjectBlur = (
                    _e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => {
                    field.onBlur();
                  };
                  return (
                    <Input
                      label="제목"
                      placeholder="제목을 입력하세요."
                      value={field.value}
                      onChange={handleSubjectChange}
                      onBlur={handleSubjectBlur}
                      showError={!!errors.subject}
                      errorMessage={errors.subject?.message}
                      required
                    />
                  );
                }}
              />
              <div className="h-px w-full bg-lg" />
              <Controller
                name="content"
                control={control}
                rules={{
                  required: '내용을 입력해 주세요.',
                }}
                render={({ field }) => {
                  const handleContentChange = (
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => {
                    field.onChange(e);
                  };
                  const handleContentBlur = (
                    _e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => {
                    field.onBlur();
                  };
                  return (
                    <Input
                      label="내용"
                      textarea={true}
                      placeholder="내용을 입력하세요."
                      minRows={12}
                      value={field.value}
                      onChange={handleContentChange}
                      onBlur={handleContentBlur}
                      showError={!!errors.content}
                      errorMessage={errors.content?.message}
                      required
                    />
                  );
                }}
              />
            </div>
          </div>
          <div className="flex justify-end mt-5 gap-2.5 px-6 pb-6">
            <MiniBtn
              type="button"
              text="취소"
              variant="white"
              onClick={onClose}
              disabled={isLoading}
            />
            <MiniBtn
              type="submit"
              text="메일 보내기"
              variant="primary"
              disabled={isLoading}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SendEmailModal;
