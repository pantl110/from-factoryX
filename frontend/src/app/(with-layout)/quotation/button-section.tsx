'use client';

import MiniBtn from '@/ui/mini-btn';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import Tooltip from '@/ui/tooltip';
import { useEffect, useState } from 'react';
import useMemberStore from '@/store/member-store';
import TaxDetailPanel from '../tax/tax-detail-panel';
import { useGetFactory } from '@/hooks';

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
  const factoryId = useMemberStore((state) => state.factoryId);

  const { getFactory, factory } = useGetFactory();

  const [showTaxTooltip, setShowTaxTooltip] = useState(false);
  const [showFactoryNameTooltip, setShowFactoryNameTooltip] = useState(false);
  const [isTaxDetailPanelOpen, setIsTaxDetailPanelOpen] = useState(false);

  useEffect(() => {
    if (factoryId) {
      getFactory(factoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);
  const hasFactoryName = factory?.name;

  return (
    <>
      <div className="flex gap-1">
        <div
          className="relative"
          onMouseEnter={() => {
            if (!isOrderStatus && !taxId) {
              setShowTaxTooltip(true);
            }
          }}
          onMouseLeave={() => {
            setShowTaxTooltip(false);
          }}
        >
          <MiniBtn
            text={taxId ? '세금계산서 보기' : '세금계산서 생성'}
            variant="whiteOutline"
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
          {showTaxTooltip && !taxId && !isOrderStatus && (
            <div className="absolute z-50 top-12 left-0 w-[350px]">
              <Tooltip
                text={'세금계산서는 주문을 확정한 후에 생성할 수 있어요.'}
                color="white"
                position="left"
              />
            </div>
          )}
        </div>
        <MiniBtn text="출력" variant="whiteOutline" onClick={onPrintClick} />
        <div
          className="relative"
          onMouseEnter={() => {
            setShowFactoryNameTooltip(true);
          }}
          onMouseLeave={() => {
            setShowFactoryNameTooltip(false);
          }}
        >
          <MiniBtn
            text="이메일 전송"
            variant="whiteOutline"
            onClick={onEmailClick}
            disabled={
              !isFormFilled ||
              !hasQuotationProducts ||
              isViewer ||
              !hasFactoryName
            }
          />
          {!hasFactoryName && showFactoryNameTooltip && (
            <div className="absolute z-50 top-12 left-0 w-[250px]">
              <Tooltip
                text={'설정에서 회사명을 입력해 주세요.'}
                color="white"
                position="left"
              />
            </div>
          )}
        </div>

        {isOrderStatus ? (
          <>
            <MiniBtn
              text="생산 시작"
              variant="primary"
              icon={ArrowRight}
              iconPosition="right"
              onClick={onStartProductionClick}
              disabled={!isFormFilled || !hasQuotationProducts || isViewer}
            />
          </>
        ) : (
          <>
            <MiniBtn
              text="임시 저장"
              variant="secondary"
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
              disabled={!isDirty || isViewer || isSaveDraftLoading}
            />
            <MiniBtn
              text="주문 확정"
              variant="primary"
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
