import {
  UseFormRegister,
  UseFormHandleSubmit,
  FieldErrors,
  UseFormWatch,
  UseFormSetError,
  UseFormClearErrors,
  UseFormSetValue,
} from 'react-hook-form';
import { ResetPasswordModel } from '@/types/data-model';
import { validateEmail } from '@/utils/validation';
import { useEmailVerification } from '@/hooks/users/use-email-verification';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface EmailStepProps {
  register: UseFormRegister<ResetPasswordModel>;
  handleSubmit: UseFormHandleSubmit<ResetPasswordModel>;
  errors: FieldErrors<ResetPasswordModel>;
  watch: UseFormWatch<ResetPasswordModel>;
  verification: {
    isVerificationSent: boolean;
    timeLeft: number;
    formatTime: (time: number) => string;
    handleResetTimer: () => void;
    startVerification: () => void;
    completeVerification: () => void;
  };
  setError: UseFormSetError<ResetPasswordModel>;
  clearErrors: UseFormClearErrors<ResetPasswordModel>;
  setValue: UseFormSetValue<ResetPasswordModel>;
  isChecking?: boolean;
}

const EmailStep = ({
  register,
  handleSubmit,
  errors,
  watch,
  verification,
  setError,
  clearErrors,
  setValue,
  isChecking = false,
}: EmailStepProps) => {
  const t = useTranslations('findPassword');
  const watchedValues = watch();
  const emailVerification = useEmailVerification();
  const [verificationCode, setVerificationCode] = useState('');

  const handleEmailCheck = async () => {
    if (!watchedValues.email || errors.email) return;

    // 이메일 인증 코드 발송
    const result = await emailVerification.sendVerificationCode({
      email: watchedValues.email,
      verification_type: 'password_reset',
    });

    if (result.success) {
      verification.handleResetTimer();
      clearErrors('email');
    } else {
      setError('email', { message: result.message });
    }
  };

  const handleEmailVerification = async (data: ResetPasswordModel) => {
    if (verification.isVerificationSent) {
      // 인증 코드 확인 단계
      if (verificationCode) {
        // 시간이 만료된 경우 우선적으로 만료 메시지 표시
        if (verification.timeLeft <= 0) {
          setError('code', { message: t('errors.verificationExpired') });
          return;
        }

        // 인증 코드 검사
        const verifyResult = await emailVerification.verifyCode({
          email: watchedValues.email,
          code: verificationCode,
          verification_type: 'password_reset',
        });

        if (verifyResult.success) {
          // 인증 완료 시 React Hook Form의 code 필드에 값 설정
          setValue('code', verificationCode);
          verification.completeVerification();
          clearErrors('code');
        } else {
          setError('code', { message: verifyResult.message });
        }
      }
    } else {
      // 이메일 인증 코드 발송
      if (data.email && !errors.email) {
        // 등록된 이메일이면 인증 코드 발송
        const sendResult = await emailVerification.sendVerificationCode({
          email: data.email,
          verification_type: 'password_reset',
        });

        if (sendResult.success) {
          verification.startVerification();
          clearErrors('email');
        } else {
          setError('email', { message: sendResult.message });
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(handleEmailVerification)} className="w-100">
      <div className="flex flex-col">
        <Input
          type="email"
          placeholder={t('email.placeholder')}
          label={t('email.label')}
          disabled={verification.isVerificationSent || isChecking}
          {...register('email', {
            required: t('email.required'),
            validate: (value) => {
              const error = validateEmail(value);
              return error || true;
            },
          })}
        />
        <div className="mt-1 mb-2 h-5">
          {errors.email && (
            <span className="text-red Re_Body-1">{errors.email.message}</span>
          )}
        </div>
      </div>
      {verification.isVerificationSent && (
        <div className="flex flex-col">
          <Input
            type="number"
            placeholder={t('verificationCode.placeholder')}
            label={t('verificationCode.label')}
            value={verificationCode}
            onChange={(e) => {
              setVerificationCode(e.target.value.slice(0, 6));
              clearErrors('code'); // 입력 시 오류 메시지 초기화
            }}
          />
          <div className="mt-2 mb-6 h-5 flex justify-between items-center">
            <div className="flex gap-2">
              <span className="text-dg Re_Body-1 w-8">
                {verification.formatTime(verification.timeLeft)}
              </span>
              {errors.code && (
                <span className="text-red Re_Body-1">
                  {errors.code.message}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleEmailCheck}
              className={`w-10.5 items-end Re_Body-1 underline ${
                verification.timeLeft > 0
                  ? 'text-lg pointer-events-none'
                  : 'text-sv'
              }`}
              disabled={verification.timeLeft > 0}
            >
              {t('buttons.resend')}
            </button>
          </div>
        </div>
      )}
      <MiniBtn variant="secondary"
        width="w-full"
        text={
          verification.isVerificationSent
            ? t('buttons.complete')
            : t('buttons.sendVerification')
        }
        height="h-12"
        type="submit"
        disabled={
          verification.isVerificationSent
            ? !verificationCode || verificationCode.length !== 6
            : !watchedValues.email || !!errors.email || isChecking
        }
      />
    </form>
  );
};

export default EmailStep;
