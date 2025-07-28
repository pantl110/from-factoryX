'use client';

import MiniBtn from '@/ui/mini-btn';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';

interface ButtonSectionProps {
  onEmailClick?: () => void;
  onPrintClick?: () => void;
  onStartProductionClick?: () => void;
  isOrderStatus: boolean;
  setIsOrderStatus: (status: boolean) => void | Promise<void>;
  isFormValid: boolean;
}

const ButtonSection = ({
  onEmailClick,
  onPrintClick,
  onStartProductionClick,
  isOrderStatus,
  setIsOrderStatus,
  isFormValid,
}: ButtonSectionProps) => {
  return (
    <div className="flex gap-1">
      <MiniBtn
        text="세금계산서 생성"
        textColor="text-dg"
        borderColor="border-lg"
        hoverColor="hover:bg-bg"
        disabled={!isFormValid}
      />
      <MiniBtn
        text="출력"
        textColor="text-dg"
        borderColor="border-lg"
        onClick={onPrintClick}
        hoverColor="hover:bg-bg"
        disabled={!isFormValid}
      />
      <MiniBtn
        text="이메일 전송"
        textColor="text-dg"
        borderColor="border-lg"
        onClick={onEmailClick}
        hoverColor="hover:bg-bg"
        disabled={!isFormValid}
      />
      {isOrderStatus ? (
        <>
          <MiniBtn
            text="수정"
            textColor="text-primary"
            bgColor="bg-primary-8"
            onClick={() => {
              setIsOrderStatus(false);
            }}
            hoverColor="hover:bg-secondary-hover"
            disabled={!isFormValid}
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
        </>
      ) : (
        <>
          <MiniBtn
            text="임시 저장"
            textColor="text-primary"
            bgColor="bg-primary-8"
            onClick={() => {}}
            hoverColor="hover:bg-secondary-hover"
            disabled={!isFormValid}
          />
          <MiniBtn
            text="주문 확정"
            textColor="text-wh"
            bgColor="bg-primary"
            onClick={() => {
              setIsOrderStatus(true);
            }}
            hoverColor="hover:bg-primary-hover"
            disabled={!isFormValid}
          />
        </>
      )}
    </div>
  );
};

export default ButtonSection;
