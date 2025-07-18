'use client';

import MiniBtn from '@/ui/mini-btn';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';

interface ButtonSectionProps {
  onEmailClick?: () => void;
  onPrintClick?: () => void;
  onStartProductionClick?: () => void;
  isClientData: boolean;
}

const ButtonSection = ({
  onEmailClick,
  onPrintClick,
  onStartProductionClick,
}: ButtonSectionProps) => {
  return (
    <div className="flex gap-1">
      <MiniBtn
        text="세금계산서 생성"
        textColor="text-dg"
        borderColor="border-lg"
        hoverColor="hover:bg-bg"
      />
      <MiniBtn
        text="출력"
        textColor="text-dg"
        borderColor="border-lg"
        onClick={onPrintClick}
        hoverColor="hover:bg-bg"
      />
      <MiniBtn
        text="이메일 전송"
        textColor="text-dg"
        borderColor="border-lg"
        onClick={onEmailClick}
        hoverColor="hover:bg-bg"
      />
      <MiniBtn
        text="생산 시작"
        textColor="text-wh"
        bgColor="bg-primary"
        icon={ArrowRight}
        iconPosition="right"
        onClick={onStartProductionClick}
        hoverColor="hover:bg-primary-hover"
      />
    </div>
  );
};

export default ButtonSection;
