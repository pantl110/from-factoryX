"use client";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import Link from "next/link";
import { useInput } from "@/hooks/use-input";
import { validateEmail, validatePassword } from "@/utils/validation";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();
  const email = useInput({
    validate: validateEmail,
  });

  const password = useInput({
    validate: validatePassword,
  });

  const handleLogin = () => {
    if (email.value && password.value && !email.error && !password.error) {
      // 로그인 처리
      router.push("/onboarding");
    }
  };

  const isButtonEnabled =
    email.value && password.value && !email.error && !password.error;

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
              value={email.value}
              onChange={email.handleChange}
            />
            <div className="mt-1 mb-2 h-5">
              {email.error && (
                <span className="text-red Re_Body-1">{email.error}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <Input
              type="password"
              placeholder="비밀번호를 입력해주세요."
              label="비밀번호"
              value={password.value}
              onChange={password.handleChange}
            />
            <div className="mt-1 mb-2 h-5">
              {password.error && (
                <span className="text-red Re_Body-1">{password.error}</span>
              )}
            </div>
          </div>
          <MiniBtn
            text="로그인"
            bgColor="bg-primary"
            textColor="text-wh"
            hoverColor="bg-primary"
            height="h-12"
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
