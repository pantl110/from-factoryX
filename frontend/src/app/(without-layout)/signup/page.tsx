'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useVerification } from '@/hooks/users/use-verification';
import { useSignup } from '@/hooks/users/use-signup';
import FactoryXLogo from '@/ui/icons/factory-x-logo';
import { SignupFormDataModel } from '@/types/data-model';
import { useState } from 'react';
import AgreeArea from './agree-area';
import PasswordStep from './password-step';
import EmailStep from './email-step';
import { useRouter } from 'next/navigation';

const SignupPage = () => {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    setError,
  } = useForm<SignupFormDataModel>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      password_confirm: '',
      terms_of_service: false,
      privacy_policy_agreement: false,
      marketing_agreement: false,
    },
  });

  const verification = useVerification();
  const signup = useSignup();
  const watchedValues = watch();

  const handleSignup = () => {
    if (watchedValues.email && !errors.email) {
      verification.startVerification();
    }
  };

  const handleVerificationComplete = () => {
    if (verificationCode) {
      verification.completeVerification();
    }
  };

  const handleSignupComplete = async (data: SignupFormDataModel) => {
    await signup.signup(data);
    if (signup.isSuccess) {
      router.push('/login');
    }
  };

  // 필수 약관 체크 여부 확인
  const isRequiredTermsChecked =
    watchedValues.terms_of_service && watchedValues.privacy_policy_agreement;

  return (
    <>
      <div className="flex min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center bg-primary">
          <FactoryXLogo width={168.908} height={30.558} color="white" />
        </div>
        <div className="flex flex-col flex-1 gap-5 items-center justify-center w-full">
          <div className="flex flex-col items-center">
            <h2 className="Heading-2">회원가입</h2>
            {verification.isVerificationSent &&
              !verification.isVerificationComplete && (
                <p className="text-sv Me_Body-1">이메일 인증</p>
              )}
            {verification.isVerificationComplete && (
              <p className="text-sv Me_Body-1">비밀번호 설정</p>
            )}
          </div>
          <form
            onSubmit={handleSubmit(handleSignupComplete)}
            className="flex flex-col w-full items-center"
          >
            {!verification.isVerificationComplete ? (
              <div className="flex flex-col w-100">
                <EmailStep
                  register={register}
                  errors={errors}
                  setError={setError}
                  watchedValues={watchedValues}
                  verificationCode={verificationCode}
                  setVerificationCode={setVerificationCode}
                  verification={verification}
                  handleSignup={handleSignup}
                  handleVerificationComplete={handleVerificationComplete}
                  isRequiredTermsChecked={isRequiredTermsChecked}
                />
              </div>
            ) : (
              <div className="flex flex-col w-100">
                <PasswordStep
                  register={register}
                  errors={errors}
                  watchedValues={watchedValues}
                  isValid={isValid}
                  signup={signup}
                />
              </div>
            )}

            {/* 약관 동의 - 이메일 인증 시작 전에만 표시 */}
            {!verification.isVerificationSent && (
              <AgreeArea watchedValues={watchedValues} setValue={setValue} />
            )}

            {/* 로그인 비밀번호 찾기 */}
            <div className="flex justify-center items-center Me-Body-1 text-sv gap-5 mt-5">
              <Link href="/login">로그인</Link>
              <Link href="/findpassword">비밀번호 찾기</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
