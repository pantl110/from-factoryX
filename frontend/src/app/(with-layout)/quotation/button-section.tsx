"use client";

import MiniBtn from "@/ui/mini-btn";
import {
  PrinterIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react/dist/ssr";

interface ButtonSectionProps {
  onEmailClick?: () => void;
  onPrintClick?: () => void;
  onStartProductionClick?: () => void;
}

const ButtonSection = ({
  onEmailClick,
  onPrintClick,
  onStartProductionClick,
}: ButtonSectionProps) => {
  return (
    <div className="flex gap-1">
      <MiniBtn
        text="출력하기"
        textColor="text-dg"
        borderColor="border-lg"
        icon={PrinterIcon}
        iconColor="text-dg"
        onClick={onPrintClick}
        hoverColor="hover:bg-bg"
      />
      <MiniBtn
        text="이메일 보내기"
        textColor="text-dg"
        borderColor="border-lg"
        icon={PaperPlaneTiltIcon}
        iconColor="text-dg"
        onClick={onEmailClick}
        hoverColor="hover:bg-bg"
      />
      <MiniBtn
        text="생산 시작하기"
        textColor="text-wh"
        bgColor="bg-primary"
        onClick={onStartProductionClick}
        hoverColor="hover:bg-primary-hover"
      />
    </div>
  );
};

export default ButtonSection;
