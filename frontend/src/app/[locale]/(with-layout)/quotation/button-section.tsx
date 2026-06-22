'use client';

import MiniBtn from '@/ui/mini-btn';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from '@/i18n/navigation';
import Tooltip from '@/ui/tooltip';
import { useEffect, useState } from 'react';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import TaxDetailPanel from '../tax/tax-detail-panel';
import { useGetFactory } from '@/hooks';
import NeedInfoModal from './modals/need-info-modal';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('quotation.buttonSection');
  const tCommon = useTranslations('common');
  const tStartProduction = useTranslations('quotation.startProductionModal');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const factoryId = useMemberStore((state) => state.factoryId);
  // 구독 상태 확인
  const { isPartnersSubscription } = useSubscriptionStore();

  const { getFactory, factory } = useGetFactory();

  const [showTaxTooltip, setShowTaxTooltip] = useState(false);
  const [isTaxDetailPanelOpen, setIsTaxDetailPanelOpen] = useState(false);
  const [isNeedInfoModalOpen, setIsNeedInfoModalOpen] = useState(false);

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
            text={taxId ? t('viewTaxInvoice') : t('createTaxInvoice')}
            variant="outline"
            disabled={
              !isPartnersSubscription() ||
              !hasSubscription() ||
              (!taxId &&
                (!isFormFilled ||
                  !hasQuotationProducts ||
                  !isOrderStatus ||
                  isViewer))
            }
            onClick={() => {
              if (taxId) {
                setIsTaxDetailPanelOpen(true);
              } else {
                setIsTaxCreatePanelOpen(true);
              }
            }}
          />
          {showTaxTooltip &&
            (!isPartnersSubscription() || (!taxId && !isOrderStatus)) && (
              <div className="absolute z-50 top-12 left-0 w-[350px]">
                <Tooltip
                  text={
                    !isPartnersSubscription()
                      ? t('tooltip.upgradeToPartners')
                      : t('tooltip.confirmOrderFirst')
                  }
                  color="white"
                  position="left"
                />
              </div>
            )}
        </div>
        <MiniBtn
          text={tCommon('print')}
          variant="outline"
          onClick={onPrintClick}
          disabled={!hasSubscription()}
        />
        <MiniBtn
          text={t('sendEmail')}
          variant="outline"
          onClick={
            hasFactoryName ? onEmailClick : () => setIsNeedInfoModalOpen(true)
          }
          disabled={
            !isFormFilled ||
            !hasQuotationProducts ||
            isViewer ||
            !hasSubscription()
          }
        />

        {isOrderStatus ? (
          <>
            <MiniBtn
              text={tStartProduction('startButton')}
              variant="secondary"
              icon={ArrowRight}
              iconPosition="right"
              onClick={onStartProductionClick}
              disabled={
                !isFormFilled ||
                !hasQuotationProducts ||
                isViewer ||
                !hasSubscription()
              }
            />
          </>
        ) : (
          <>
            <MiniBtn
              text={t('saveDraft')}
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
              disabled={
                !isDirty || isViewer || isSaveDraftLoading || !hasSubscription()
              }
            />
            <MiniBtn
              text={t('confirmOrder')}
              variant="secondary"
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
                isSaveDraftLoading ||
                !hasSubscription()
              }
            />
          </>
        )}
      </div>

      {/* 세금계산서 상세 패널 */}
      {isTaxDetailPanelOpen && taxId && (
        <TaxDetailPanel
          itemId={taxId}
          onClose={() => setIsTaxDetailPanelOpen(false)}
        />
      )}

      {/* 이메일 전송을 위해 회사 정보가 필요해요 */}
      {isNeedInfoModalOpen && (
        <NeedInfoModal
          onClose={() => setIsNeedInfoModalOpen(false)}
          onSaveDraft={onSaveDraft ?? (() => false)}
          isOrderStatus={isOrderStatus}
        />
      )}
    </>
  );
};

export default ButtonSection;
