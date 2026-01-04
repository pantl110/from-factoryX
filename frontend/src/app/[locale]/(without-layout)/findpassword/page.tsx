'use client';

import { Link } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { useVerification } from '@/hooks/users/use-verification';
import { useResetPassword } from '@/hooks/users/use-reset-password';
import { ResetPasswordModel } from '@/types/data-model';
import EmailStep from './email-step';
import PasswordStep from './password-step';
import { useTranslations } from 'next-intl';
import FactoryXLogo from '@/ui/icons/factory-x-logo';

const FindPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
    clearErrors,
    setValue,
  } = useForm<ResetPasswordModel>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      code: '',
      new_password: '',
      new_password_confirm: '',
    },
  });

  const t = useTranslations('findPassword');
  const tLogin = useTranslations('login');
  const verification = useVerification();
  const resetPassword = useResetPassword();

  const handlePasswordReset = async (data: ResetPasswordModel) => {
    // 인증이 완료된 상태에서는 인증 코드 없이 비밀번호만 전송
    await resetPassword.resetPassword(data);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-[0.8] bg-primary flex flex-col items-center justify-center">
        <FactoryXLogo width={168.908} height={30.558} color="white" />
      </div>
      <div className="flex flex-col flex-[1.2] gap-5 items-center justify-center w-full">
        <div className="flex flex-col items-center">
          <h2 className="Heading-2">
            {!verification.isVerificationComplete
              ? tLogin('findPassword')
              : t('title.resetPassword')}
          </h2>
          {verification.isVerificationSent &&
            !verification.isVerificationComplete && (
              <p className="text-sv Me_Body-1">
                {t('subtitle.emailVerification')}
              </p>
            )}
          {verification.isVerificationComplete && (
            <p className="text-sv Me_Body-1">{t('subtitle.setPassword')}</p>
          )}
        </div>
        <div className="flex flex-col w-full items-center">
          {!verification.isVerificationComplete ? (
            <EmailStep
              register={register}
              handleSubmit={handleSubmit}
              errors={errors}
              watch={watch}
              verification={verification}
              setError={setError}
              clearErrors={clearErrors}
              setValue={setValue}
            />
          ) : (
            <PasswordStep
              register={register}
              handleSubmit={handleSubmit}
              errors={errors}
              watch={watch}
              isValid={isValid}
              onSubmit={handlePasswordReset}
              resetPassword={resetPassword}
            />
          )}
          <div className="flex justify-center items-center Me-Body-1 text-sv gap-5 mt-5">
            <Link href="/login">{tLogin('button')}</Link>
            <Link href="/signup">{tLogin('signup')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindPasswordPage;
