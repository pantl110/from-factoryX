"use client";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import Link from "next/link";
import { useInput } from "@/hooks/useInput";
import { useVerification } from "@/hooks/useVerification";
import { usePassword } from "@/hooks/usePassword";
import { validateEmail } from "@/utils/validation";

const SignupPage = () => {
  const email = useInput({
    validate: validateEmail,
  });

  const verificationCode = useInput();

  const verification = useVerification();

  const password = usePassword();

  const handleSignup = () => {
    if (email.value && !email.error) {
      verification.startVerification();
    }
  };

  const handleVerificationComplete = () => {
    if (verificationCode.value) {
      verification.completeVerification();
    }
  };

  const handleSignupComplete = () => {
    // 회원가입 완료 처리
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-primary"></div>
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
        <div className="flex flex-col w-full px-[100px]">
          {!verification.isVerificationComplete ? (
            <>
              <div className="flex flex-col">
                <Input
                  type="email"
                  placeholder="이메일을 입력해주세요."
                  label="이메일"
                  value={email.value}
                  onChange={email.handleChange}
                  disabled={verification.isVerificationSent}
                />
                <div className="mt-1 mb-2 h-5">
                  {email.error && (
                    <span className="text-red Re_Body-1">{email.error}</span>
                  )}
                </div>
              </div>
              {verification.isVerificationSent && (
                <div className="flex flex-col">
                  <Input
                    type="text"
                    placeholder="이메일로 전송된 6자리 인증 코드를 입력해주세요."
                    label="인증 코드"
                    value={verificationCode.value}
                    onChange={verificationCode.handleChange}
                  />
                  <div className="mt-2 mb-5 h-5 flex justify-between items-center">
                    <span className="text-dg Re_Body-1">
                      {verification.formatTime(verification.timeLeft)}
                    </span>
                    <button
                      onClick={verification.resetTimer}
                      className="text-sv Re_Body-1 underline"
                    >
                      재전송
                    </button>
                  </div>
                </div>
              )}
              <MiniBtn
                text={
                  verification.isVerificationSent ? "인증 완료" : "이메일 인증"
                }
                bgColor="bg-primary"
                textColor="text-wh"
                hoverColor="bg-primary"
                height={48}
                onClick={
                  verification.isVerificationSent
                    ? handleVerificationComplete
                    : handleSignup
                }
                disabled={
                  verification.isVerificationSent
                    ? !verificationCode.value
                    : !email.value || !!email.error
                }
              />
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <Input
                  type="password"
                  placeholder="비밀번호를 입력해주세요."
                  label="비밀번호"
                  value={password.password}
                  onChange={password.handlePasswordChange}
                  showPasswordToggle={true}
                />
                <div className="mt-1 mb-2 h-5">
                  {password.errors.password && (
                    <span className="text-red Re_Body-1">
                      {password.errors.password}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <Input
                  type="password"
                  placeholder="비밀번호를 다시 입력해주세요."
                  label="비밀번호 확인"
                  value={password.confirmPassword}
                  onChange={password.handleConfirmPasswordChange}
                  showPasswordToggle={true}
                />
                <div className="mt-1 mb-2 h-5">
                  {password.errors.confirmPassword && (
                    <span className="text-red Re_Body-1">
                      {password.errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>
              <MiniBtn
                text="가입 완료"
                bgColor="bg-primary"
                textColor="text-wh"
                hoverColor="bg-primary"
                height={48}
                onClick={handleSignupComplete}
                disabled={!password.isValid}
              />
            </>
          )}
          <div className="flex justify-center items-center Me-Body-1 text-sv gap-5 mt-5">
            <Link href="/login">로그인</Link>
            <Link href="/findpassword">비밀번호 찾기</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
