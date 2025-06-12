"use client";

import MiniBtn from "@/ui/mini-btn";
import {
  PrinterIcon,
  PaperPlaneTiltIcon,
  FactoryIcon,
} from "@phosphor-icons/react/dist/ssr";

const ButtonSection = () => {
  return (
    <div className="flex gap-1">
      <MiniBtn
        text="출력하기"
        textColor="text-dg"
        borderColor="border-[#eeeeee]"
        icon={PrinterIcon}
        iconColor="text-sv"
      />
      <MiniBtn
        text="이메일 보내기"
        textColor="text-dg"
        borderColor="border-[#eeeeee]"
        icon={PaperPlaneTiltIcon}
        iconColor="text-sv"
      />
      <MiniBtn
        text="생산 시작하기"
        textColor="text-primary"
        icon={FactoryIcon}
        iconColor="text-primary"
        bgColor="bg-primary-8"
      />
    </div>
  );
};

export default ButtonSection;
