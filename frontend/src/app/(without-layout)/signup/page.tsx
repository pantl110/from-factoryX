"use client";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useState, useEffect } from "react";
import Link from "next/link";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!isVerificationSent || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerificationSent, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) {
      if (!validateEmail(value)) {
        setErrors((prev) => ({
          ...prev,
          email: "이메일 형식이 올바르지 않습니다.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    } else {
      setErrors((prev) => ({ ...prev, email: "이메일을 입력해주세요." }));
    }
  };

  const handleVerificationCodeChange = (value: string) => {
    setVerificationCode(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value && confirmPassword && value !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "비밀번호가 일치하지 않습니다.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value && password && value !== password) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "비밀번호가 일치하지 않습니다.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleSignup = () => {
    if (email && !errors.email) {
      setIsVerificationSent(true);
      setTimeLeft(180);
    }
  };

  const handleVerificationComplete = () => {
    if (verificationCode) {
      setIsVerificationComplete(true);
    }
  };

  const handleSignupComplete = () => {
    // 회원가입 완료 처리
  };

  const handleResend = () => {
    setTimeLeft(180);
  };

  const isEmailButtonEnabled = email && !errors.email;
  const isPasswordButtonEnabled =
    password && confirmPassword && !errors.confirmPassword;

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-primary"></div>
      <div className="flex flex-col flex-1 gap-5 items-center justify-center w-full">
        <div className="flex flex-col items-center">
          <h2 className="Heading-2">회원가입</h2>
          {isVerificationSent && !isVerificationComplete && (
            <p className="text-sv Me_Body-1">이메일 인증</p>
          )}
          {isVerificationComplete && (
            <p className="text-sv Me_Body-1">비밀번호 설정</p>
          )}
        </div>
        <div className="flex flex-col w-full px-[100px]">
          {!isVerificationComplete ? (
            <>
              <div className="flex flex-col">
                <Input
                  type="email"
                  placeholder="이메일을 입력해주세요."
                  label="이메일"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isVerificationSent}
                />
                <div className="mt-1 mb-2 h-5">
                  {errors.email && (
                    <span className="text-red Re_Body-1">{errors.email}</span>
                  )}
                </div>
              </div>
              {isVerificationSent && (
                <div className="flex flex-col">
                  <Input
                    type="text"
                    placeholder="인증 코드를 입력해주세요."
                    label="인증 코드"
                    value={verificationCode}
                    onChange={handleVerificationCodeChange}
                  />
                  <div className="mt-2 mb-5 h-5 flex justify-between items-center">
                    <span className="text-dg Re_Body-1">
                      {formatTime(timeLeft)}
                    </span>
                    <button
                      onClick={handleResend}
                      className="text-sv Re_Body-1 underline"
                    >
                      재전송
                    </button>
                  </div>
                </div>
              )}
              <MiniBtn
                text={isVerificationSent ? "인증 완료" : "이메일 인증"}
                bgColor="bg-primary"
                textColor="text-wh"
                hoverColor="bg-primary"
                height={48}
                onClick={
                  isVerificationSent ? handleVerificationComplete : handleSignup
                }
                disabled={
                  isVerificationSent ? !verificationCode : !isEmailButtonEnabled
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
                  value={password}
                  onChange={handlePasswordChange}
                  showPasswordToggle={true}
                />
                <div className="mt-1 mb-2 h-5">
                  {errors.password && (
                    <span className="text-red Re_Body-1">
                      {errors.password}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <Input
                  type="password"
                  placeholder="비밀번호를 다시 입력해주세요."
                  label="비밀번호 확인"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  showPasswordToggle={true}
                />
                <div className="mt-1 mb-2 h-5">
                  {errors.confirmPassword && (
                    <span className="text-red Re_Body-1">
                      {errors.confirmPassword}
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
                disabled={!isPasswordButtonEnabled}
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
