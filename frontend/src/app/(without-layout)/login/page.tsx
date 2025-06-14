"use client";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";

const LoginPage = () => {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-primary"></div>
      <div className="flex flex-col flex-1 gap-5 items-center justify-center w-full">
        <h2 className="Heading-2">로그인</h2>
        <div className="flex flex-col gap-5 w-full px-[100px]">
          <Input
            type="email"
            placeholder="이메일을 입력해주세요."
            label="이메일"
          />
          <Input
            type="password"
            placeholder="비밀번호를 입력해주세요."
            label="비밀번호"
          />
          <MiniBtn
            text="로그인"
            bgColor="bg-primary"
            textColor="text-wh"
            hoverColor="bg-primary"
            height={48}
          />
          <div className="flex justify-center items-center Me-Body-1 text-sv gap-5">
            <p>회원가입</p>
            <p>비밀번호 찾기</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
