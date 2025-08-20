'use client';

import MiniBtn from '@/ui/mini-btn';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';

interface ButtonSectionProps {
  setIsTaxCreatePanelOpen: (open: boolean) => void;
  onEmailClick?: () => void;
  onPrintClick?: () => void;
  onStartProductionClick?: () => void;
  onSaveDraft?: () => boolean | Promise<boolean>;
  isOrderStatus: boolean;
  changeToConfirmed: () => void | Promise<void>;
  isFormFilled: boolean;
  hasQuotationProducts: boolean;
  isDirty: boolean;
}

const ButtonSection = ({
  setIsTaxCreatePanelOpen,
  onEmailClick,
  onPrintClick,
  onStartProductionClick,
  onSaveDraft,
  isOrderStatus,
  changeToConfirmed,
  isFormFilled,
  hasQuotationProducts,
  isDirty,
}: ButtonSectionProps) => {
  const router = useRouter();
  return (
    <>
      <div className="flex gap-1">
        <MiniBtn
          text="세금계산서 생성"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
          disabled={!isFormFilled || !isOrderStatus}
          onClick={() => setIsTaxCreatePanelOpen(true)}
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
        {isOrderStatus ? (
          <>
            <MiniBtn
              text="생산 시작"
              textColor="text-wh"
              bgColor="bg-primary"
              icon={ArrowRight}
              iconPosition="right"
              onClick={onStartProductionClick}
              hoverColor="hover:bg-primary-hover"
              disabled={!isFormFilled || !hasQuotationProducts}
            />
          </>
        ) : (
          <>
            <MiniBtn
              text="임시 저장"
              textColor="text-primary"
              bgColor="bg-primary-8"
              onClick={async () => {
                try {
                  const isSuccess = await onSaveDraft?.();
                  if (isSuccess) {
                    router.push('/project/process');
                  }
                } catch {
                  // 에러가 발생하면 페이지 이동하지 않음
                }
              }}
              hoverColor="hover:bg-secondary-hover"
              disabled={!isDirty}
            />
            <MiniBtn
              text="주문 확정"
              textColor="text-wh"
              bgColor="bg-primary"
              onClick={() => {
                onSaveDraft?.();
                changeToConfirmed();
              }}
              hoverColor="hover:bg-primary-hover"
              disabled={!isFormFilled || !hasQuotationProducts}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ButtonSection;
