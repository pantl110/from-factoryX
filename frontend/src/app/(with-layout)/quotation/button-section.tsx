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
  onSaveDraft?: (isConfirm: boolean) => boolean | Promise<boolean>;
  isOrderStatus: boolean;
  isFormFilled: boolean;
  hasQuotationProducts: boolean;
  isDirty: boolean;
  taxId: number | null;
  isSaveDraftLoading?: boolean;
  refresh?: () => void;
}

const ButtonSection = ({
  setIsTaxCreatePanelOpen,
  onEmailClick,
  onPrintClick,
  onStartProductionClick,
  onSaveDraft,
  isOrderStatus,
  isFormFilled,
  hasQuotationProducts,
  isDirty,
  taxId,
  isSaveDraftLoading,
  refresh,
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
          {showTooltip && !taxId && !isOrderStatus && (
            <div className="absolute z-50 top-12 left-0 w-[350px]">
              <Tooltip
                text={'세금계산서는 주문을 확정한 후에 생성할 수 있어요.'}
                color="white"
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
          disabled={!isFormFilled || !hasQuotationProducts || isViewer}
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
                  const isSuccess = await onSaveDraft?.(false);
                  if (isSuccess) {
                    router.push('/project/process');
                  }
                } catch {
                  // 에러가 발생하면 페이지 이동하지 않음
                }
              }}
              hoverColor="hover:bg-secondary-hover"
              disabled={!isDirty || isViewer || isSaveDraftLoading}
            />
            <MiniBtn
              text="주문 확정"
              textColor="text-wh"
              bgColor="bg-primary"
              onClick={async () => {
                try {
                  const isSuccess = await onSaveDraft?.(true);
                  if (isSuccess) {
                    // 성공 시 refresh 콜백 호출하여 부모 컴포넌트 상태 업데이트
                    refresh?.();
                  }
                } catch {
                  // 에러가 발생하면 페이지 이동하지 않음
                }
              }}
              hoverColor="hover:bg-primary-hover"
              disabled={
                !isFormFilled ||
                !hasQuotationProducts ||
                isViewer ||
                isSaveDraftLoading
              }
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
