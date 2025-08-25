'use client';

import MiniBtn from '@/ui/mini-btn';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import Tooltip from '@/ui/tooltip';
import { useState } from 'react';
import useMemberStore from '@/store/member-store';
import TaxDetailPanel from '../tax/tax-detail-panel';

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
  taxId: number | null;
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
  taxId,
}: ButtonSectionProps) => {
  const router = useRouter();
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const [showTooltip, setShowTooltip] = useState(false);
  const [isTaxDetailPanelOpen, setIsTaxDetailPanelOpen] = useState(false);
  return (
    <>
      <div className="flex gap-1">
        <div
          className="relative"
          onMouseEnter={() => {
            if (!isOrderStatus && !taxId) {
              setShowTooltip(true);
            }
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
          }}
        >
          <MiniBtn
            text={taxId ? '세금계산서 보기' : '세금계산서 생성'}
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            disabled={
              !taxId &&
              (!isFormFilled ||
                !hasQuotationProducts ||
                !isOrderStatus ||
                isViewer)
            }
            onClick={() => {
              if (taxId) {
                setIsTaxDetailPanelOpen(true);
              } else {
                setIsTaxCreatePanelOpen(true);
              }
            }}
          />
          {showTooltip && !taxId && (
            <div className="absolute z-50 -top-2 -left-2">
              <Tooltip
                text={
                  !isOrderStatus
                    ? '주문 확정 상태에서만 생성할 수 있습니다'
                    : ''
                }
                color="red"
                position="left"
              />
            </div>
          )}
        </div>
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
          disabled={isViewer}
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
              disabled={!isFormFilled || !hasQuotationProducts || isViewer}
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
              disabled={!isDirty || isViewer}
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
              disabled={!isFormFilled || !hasQuotationProducts || isViewer}
            />
          </>
        )}
      </div>

      {isTaxDetailPanelOpen && taxId && (
        <TaxDetailPanel
          itemId={taxId}
          onClose={() => setIsTaxDetailPanelOpen(false)}
        />
      )}
    </>
  );
};

export default ButtonSection;
