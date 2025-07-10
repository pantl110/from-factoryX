"use client";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import Checkbox from "@/ui/checkbox";
import Link from "next/link";
import { useInput } from "@/hooks/use-input";
import { useVerification } from "@/hooks/use-verification";
import { usePassword } from "@/hooks/use-password";
import { useCheckAll } from "@/hooks/use-check-all";
import { validateEmail } from "@/utils/validation";
import FactoryXLogo from "@/ui/icons/factory-x-logo";

const SignupPage = () => {
  const email = useInput({
    validate: validateEmail,
  });

  const verificationCode = useInput();
  const verification = useVerification();
  const password = usePassword();
  const checkboxes = useCheckAll(["service", "privacy", "marketing"]);

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

  // 필수 약관 체크 여부 확인
  const isRequiredTermsChecked =
    checkboxes.isChecked("service") && checkboxes.isChecked("privacy");

  return (
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
        <div className="flex flex-col w-full px-[100px]">
          {!verification.isVerificationComplete ? (
            <>
              <div className="flex flex-col">
                <Input
                  type="email"
                  placeholder="이메일을 입력해주세요."
                  label="이메일"
                  value={email.value}
                  onChange={(e) => email.handleChange(e.target.value)}
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
                    onChange={(e) =>
                      verificationCode.handleChange(e.target.value)
                    }
                  />
                  <div className="mt-2 mb-5 h-5 flex justify-between items-center">
                    <span className="text-dg Re_Body-1">
                      {verification.formatTime(verification.timeLeft)}
                    </span>
                    <button
                      onClick={verification.handleResetTimer}
                      className="text-sv Re_Body-1 underline"
                    >
                      재전송
                    </button>
                  </div>
                </div>
              )}
              <MiniBtn
                width="w-full"
                text={
                  verification.isVerificationSent ? "인증 완료" : "이메일 인증"
                }
                bgColor="bg-primary"
                textColor="text-wh"
                hoverColor="hover:bg-primary-hover"
                height="h-12"
                onClick={
                  verification.isVerificationSent
                    ? handleVerificationComplete
                    : handleSignup
                }
                disabled={
                  verification.isVerificationSent
                    ? !verificationCode.value
                    : !email.value || !!email.error || !isRequiredTermsChecked
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
                  onChange={(e) =>
                    password.handlePasswordChange(e.target.value)
                  }
                  isShowPasswordToggle={true}
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
                  onChange={(e) =>
                    password.handleConfirmPasswordChange(e.target.value)
                  }
                  isShowPasswordToggle={true}
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
                width="w-full"
                text="가입 완료"
                bgColor="bg-primary"
                textColor="text-wh"
                hoverColor="hover:bg-primary-hover"
                height="h-12"
                onClick={handleSignupComplete}
                disabled={!password.isValid}
              />
            </>
          )}

          {/* 약관 동의 */}
          <div className="flex flex-col gap-2 mt-5">
            <div className="flex gap-2">
              <Checkbox
                isChecked={checkboxes.isAllChecked}
                onToggle={checkboxes.toggleAll}
              />
              <p className="text-bl Me_Body-1">모두 동의</p>
            </div>
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Checkbox
                  isChecked={checkboxes.isChecked("service")}
                  onToggle={() => checkboxes.toggleOne("service")}
                />
                <p className="text-sv Me_Body-1">서비스 이용약관 (필수)</p>
              </div>
              <p className="text-sv Me_Body-1">약관 보기</p>
            </div>
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Checkbox
                  isChecked={checkboxes.isChecked("privacy")}
                  onToggle={() => checkboxes.toggleOne("privacy")}
                />
                <p className="text-sv Me_Body-1">
                  개인정보 수집 및 이용 동의 (필수)
                </p>
              </div>
              <p className="text-sv Me_Body-1">약관 보기</p>
            </div>
            <div className="flex gap-2">
              <Checkbox
                isChecked={checkboxes.isChecked("marketing")}
                onToggle={() => checkboxes.toggleOne("marketing")}
              />
              <p className="text-sv Me_Body-1">마케팅 정보 수신 동의 (선택)</p>
            </div>
          </div>

          {/* 로그인 비밀번호 찾기 */}
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
