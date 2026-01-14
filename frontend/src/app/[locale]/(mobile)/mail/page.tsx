'use client';

import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Topbar from '../topbar';
import { MoBottomNavigation, MoInput, MoToast, Spinner } from '@/ui';
import { useTranslations, useLocale } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { getTaxInvoiceAccountQueryFn } from '@/hooks';
import { useSendEmailForAccount, useToast } from '@/hooks';
import useMemberStore from '@/store/member-store';
import { useGetFactory } from '@/hooks';
import { getMonthDisplay } from '@/utils';
import { WarningCircle, CheckCircle } from '@phosphor-icons/react';

interface EmailFormModel {
  recipient: string;
  subject: string;
  content: string;
}

const MailPage = () => {
  const t = useTranslations('tax.list.sendEmailModal');
  const tList = useTranslations('tax.list');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const taxId = searchParams.get('taxId')
    ? Number(searchParams.get('taxId'))
    : null;

  const factoryId = useMemberStore((state) => state.factoryId);
  const { getFactory, factory } = useGetFactory();
  const { sendEmailForAccount } = useSendEmailForAccount();
  const { showToast, isToastOpen, isVisible } = useToast();
  const {
    showToast: showSuccessToast,
    isToastOpen: isSuccessToastOpen,
    isVisible: isSuccessToastVisible,
  } = useToast();
  const queryClient = useQueryClient();
  const [errorText, setErrorText] = React.useState('');
  const [errorSubtext, setErrorSubtext] = React.useState('');
  const [successText, setSuccessText] = React.useState('');
  const [successSubtext, setSuccessSubtext] = React.useState('');

  // 공장 정보 가져오기
  useEffect(() => {
    if (factoryId) {
      getFactory(factoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  // Account 정보 가져오기
  const {
    data: account,
    isLoading: isLoadingAccount,
    error: accountError,
  } = useQuery<TaxInvoiceAccountModel>({
    queryKey: ['tax-invoice-account', taxId, 'tax'],
    enabled: !!taxId,
    queryFn: () => {
      if (!taxId) {
        throw new Error('Tax ID is required');
      }
      return getTaxInvoiceAccountQueryFn(taxId, 'tax');
    },
  });

  const clientName = account?.client?.name || '';
  const clientEmail = account?.client?.email || '';
  const factoryName = factory?.name || '';

  // 현재 달 가져오기
  const currentMonth = useMemo(() => {
    return new Date().getMonth() + 1;
  }, []);

  // 영어일 때는 월 이름, 한국어일 때는 숫자
  const monthDisplay = useMemo(() => {
    return getMonthDisplay(currentMonth, locale);
  }, [locale, currentMonth]);

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

  const { control, handleSubmit, reset } = useForm<EmailFormModel>({
    defaultValues: {
      recipient: clientEmail || '',
      subject: factoryName
        ? t('subjectTemplate.withFactory', {
            factoryName,
            month: monthDisplay,
          })
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
        ? t('subjectTemplate.withFactory', {
            factoryName,
            month: monthDisplay,
          })
        : t('subjectTemplate.withoutFactory', { month: monthDisplay }),
      content: emailContent,
    });
  }, [clientEmail, monthDisplay, emailContent, factoryName, reset, t]);

  const onSubmit = async (data: EmailFormModel) => {
    if (!taxId) return;

    const result = await sendEmailForAccount(taxId, data);

    if (result.success && result.data) {
      // account 페이지로 돌아가기 전에 관련 쿼리 무효화하여 최신 데이터 불러오기
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === 'tax-invoice-account' &&
            key[1] === taxId
          );
        },
      });
      // 성공 토스트 표시
      setSuccessText(tList('errors.emailSendSuccess'));
      setSuccessSubtext(tList('errors.emailSendSuccessSubtext') || '');
      showSuccessToast();
      // 성공 토스트 표시 후 일정 시간 후에 뒤로 가기
      setTimeout(() => {
        router.back();
      }, 1500);
    } else if (result.error) {
      setErrorText(tList('errors.emailSendFailed'));
      setErrorSubtext(
        result.error || tList('accountPayment.errors.unknownError')
      );
      showToast();
    }
  };

  if (isLoadingAccount) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (accountError || !account) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="m-Body-2 text-sv">
          {tList('accountPayment.errors.accountNotFound')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="pb-23">
        <Topbar title={t('title')} />

        <div className="px-7 py-8 flex flex-col gap-7">
          <p className="m-Body-2 text-gr">{t('subtitle')}</p>
          <form id="email-form" onSubmit={handleSubmit(onSubmit)}>
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
                    <div className="flex flex-col gap-2">
                      <MoInput
                        label={t('labels.recipient')}
                        placeholder={t('placeholders.recipient')}
                        value={field.value}
                        onChange={handleRecipientChange}
                        onBlur={handleRecipientBlur}
                        required
                      />
                    </div>
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
                    <div className="flex flex-col gap-2">
                      <MoInput
                        label={t('labels.subject')}
                        placeholder={t('placeholders.subject')}
                        value={field.value}
                        onChange={handleSubjectChange}
                        onBlur={handleSubjectBlur}
                        required
                      />
                    </div>
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
                    <div className="flex flex-col gap-2">
                      <MoInput
                        label={t('labels.content')}
                        placeholder={t('placeholders.content')}
                        value={field.value}
                        onChange={handleContentChange}
                        onBlur={handleContentBlur}
                        required
                        textarea
                        minRows={12}
                      />
                    </div>
                  );
                }}
              />
            </div>
          </form>
        </div>
      </div>
      <MoBottomNavigation
        type="mail"
        onClick={() => {
          const form = document.getElementById('email-form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }}
      />
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
      {/* 성공 토스트 */}
      {isSuccessToastOpen && (
        <MoToast
          icon={<CheckCircle size={20} className="text-primary" />}
          text={successText}
          subtext={successSubtext}
          type="primary"
          isVisible={isSuccessToastVisible}
        />
      )}
    </>
  );
};

export default MailPage;
