"use client";

import MiniBtn from "@/ui/mini-btn";
import {
  PrinterIcon,
  PaperPlaneTiltIcon,
  FactoryIcon,
} from "@phosphor-icons/react/dist/ssr";

interface ButtonSectionProps {
  onEmailClick?: () => void;
  onPrintClick?: () => void;
}

const ButtonSection = ({ onEmailClick, onPrintClick }: ButtonSectionProps) => {
  return (
    <div className="flex gap-1">
      <MiniBtn
        text="출력하기"
        textColor="text-dg"
        borderColor="border-[#eeeeee]"
        icon={PrinterIcon}
        iconColor="text-sv"
        onClick={onPrintClick}
      />
      <MiniBtn
        text="이메일 보내기"
        textColor="text-dg"
        borderColor="border-[#eeeeee]"
        icon={PaperPlaneTiltIcon}
        iconColor="text-sv"
        onClick={onEmailClick}
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
