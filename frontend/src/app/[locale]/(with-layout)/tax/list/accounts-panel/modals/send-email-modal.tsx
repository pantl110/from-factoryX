import { Input, MiniBtn } from '@/ui';
import Modal from '@/ui/modal/modal';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import { useGetFactory } from '@/hooks';
import { useTranslations, useLocale } from 'next-intl';
import { getMonthDisplay } from '@/utils';

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
  const t = useTranslations('tax.list.sendEmailModal');
  const tCommon = useTranslations('common');
  const locale = useLocale();
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

  // 영어일 때는 월 이름, 한국어일 때는 숫자
  const monthDisplay = useMemo(() => {
    return getMonthDisplay(currentMonth, locale);
  }, [locale, currentMonth]);

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
    return `${t('emailTemplate.greeting', { clientName })}
    
${t('emailTemplate.body1', { month: currentMonth })}
${t('emailTemplate.body2')}

${t('emailTemplate.settlementAmount', { amount: formattedAmount })}
${t('emailTemplate.paymentDeadline', { date: paymentDate })}

${t('emailTemplate.body3')}
${t('emailTemplate.body4')}

${t('emailTemplate.closing')}`;
  }, [clientName, currentMonth, paymentDate, formattedAmount, t]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailFormModel>({
    defaultValues: {
      recipient: clientEmail || '',
      subject: factoryName
        ? t('subjectTemplate.withFactory', { factoryName, month: monthDisplay })
        : t('subjectTemplate.withoutFactory', { month: monthDisplay }),
      content: emailContent,
    },
    mode: 'onChange',
  });

  // account가 변경되면 받는 사람 필드 업데이트
  useEffect(() => {
    reset({
      recipient: clientEmail || '',
      subject: factoryName
        ? t('subjectTemplate.withFactory', { factoryName, month: monthDisplay })
        : t('subjectTemplate.withoutFactory', { month: monthDisplay }),
      content: emailContent,
    });
  }, [clientEmail, monthDisplay, emailContent, factoryName, reset, t]);

  const onSubmit = (data: EmailFormModel) => {
    onSendEmail(data);
  };

  return (
    <Modal
      title={t('title')}
      subtitle={t('subtitle')}
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
                  required: t('errors.recipientRequired'),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t('errors.recipientInvalid'),
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
                      label={t('labels.recipient')}
                      placeholder={t('placeholders.recipient')}
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
                  required: t('errors.subjectRequired'),
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
                      label={t('labels.subject')}
                      placeholder={t('placeholders.subject')}
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
                  required: t('errors.contentRequired'),
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
                      label={t('labels.content')}
                      textarea={true}
                      placeholder={t('placeholders.content')}
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
              text={tCommon('cancel')}
              variant="white"
              onClick={onClose}
              disabled={isLoading}
            />
            <MiniBtn
              type="submit"
              text={t('sendButton')}
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
