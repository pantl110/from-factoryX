"use client";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useState } from "react";
import Link from "next/link";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    login: "",
  });

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

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (!value) {
      setErrors((prev) => ({ ...prev, password: "비밀번호를 입력해주세요." }));
    } else {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleLogin = () => {
    if (validateInputs()) {
      setErrors((prev) => ({
        ...prev,
        login: "이메일 또는 비밀번호가 올바르지 않습니다.",
      }));
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInputs = () => {
    const newErrors = {
      email: "",
      password: "",
      login: "",
    };

    if (!email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!validateEmail(email)) {
      newErrors.email = "이메일 형식이 올바르지 않습니다.";
    }

    if (!password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const isButtonEnabled =
    email && password && !errors.email && !errors.password;

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-primary"></div>
      <div className="flex flex-col flex-1 gap-5 items-center justify-center w-full">
        <h2 className="Heading-2">로그인</h2>
        <div className="flex flex-col w-full px-[100px]">
          <div className="flex flex-col">
            <Input
              type="email"
              placeholder="이메일을 입력해주세요."
              label="이메일"
              value={email}
              onChange={handleEmailChange}
            />
            <div className="mt-1 mb-2 h-5">
              {errors.email && (
                <span className="text-red Re_Body-1">{errors.email}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <Input
              type="password"
              placeholder="비밀번호를 입력해주세요."
              label="비밀번호"
              value={password}
              onChange={handlePasswordChange}
            />
            <div className="mt-1 mb-2 h-5">
              {errors.password && (
                <span className="text-red Re_Body-1">{errors.password}</span>
              )}
            </div>
          </div>
          <MiniBtn
            text="로그인"
            bgColor="bg-primary"
            textColor="text-wh"
            hoverColor="bg-primary"
            height={48}
            onClick={handleLogin}
            disabled={!isButtonEnabled}
          />
          <div className="flex justify-center items-center Me-Body-1 text-sv gap-5 mt-5">
            <Link href="/signup">회원가입</Link>
            <Link href="/findpassword">비밀번호 찾기</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
