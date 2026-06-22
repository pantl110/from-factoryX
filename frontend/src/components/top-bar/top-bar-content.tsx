'use client';

import MiniBtn from '@/ui/mini-btn';
import { BellSimple } from '@phosphor-icons/react'; // ChatCircle, FilePlus 임시 주석처리
import { ProductionTabType } from './types';
import ProfileImage from '@/ui/profile-image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import usePageStatusStore from '@/store/page-status-store';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import ProfileModal from './modals/profile-modal';
import TaxDetailPanel from '@/app/[locale]/(with-layout)/tax/tax-detail-panel';
import Tooltip from '@/ui/tooltip';
import { useTooltip, useManufacturedToDelivery } from '@/hooks';
import { useTranslations } from 'next-intl';

interface TopBarContentProps {
  productionTab: ProductionTabType | null;
  pageStatus: string | null;
  hasUnreadNotifications: boolean;
  onProductionPlanSaveClick?: () => void;
  onMoveToStorageClick?: () => void;
  onNotificationClick?: () => void;
  onNoraClick?: () => void;
  onCloudUploadClick?: () => void;
}

const TopBarContent = ({
  productionTab,
  pageStatus,
  hasUnreadNotifications,
  onProductionPlanSaveClick,
  onMoveToStorageClick,
  onNotificationClick,
  onNoraClick,
  onCloudUploadClick,
}: TopBarContentProps) => {
  const t = useTranslations('topBar');
  const tCommon = useTranslations('common');
  const tProduction = useTranslations('production');
  const isProductionPlanValid = usePageStatusStore(
    (state) => state.isProductionPlanValid
  ); // 생산 계획 폼 유효성 검사 상태
  const isAllProductionCompleted = usePageStatusStore(
    (state) => state.isAllProductionCompleted
  ); // 모든 제품이 가동 완료 상태인지 여부
  const isProductionLogValid = usePageStatusStore(
    (state) => state.isProductionLogValid
  ); // 생산 내역 입력값이 유효한지 여부
  const isAllProductionResultComplete = usePageStatusStore(
    (state) => state.isAllProductionResultComplete
  ); // 모든 plan의 material_consumed가 true이고 defective_quantity가 입력되어 있는지 여부
  const projectStatusData = usePageStatusStore(
    (state) => state.projectStatusData
  );
  const isRefund = !!projectStatusData?.is_refunded; // 반품 여부
  const taxId = projectStatusData?.tax_invoice?.id || null; // 세금계산서 ID
  // 구독 상태 확인
  const { isPartnersSubscription } = useSubscriptionStore();
  // 세금계산서 패널 상태
  const [isTaxPanelOpen, setIsTaxPanelOpen] = useState(false);
  // 세금계산서 버튼 툴팁 (조건부로만 동작)
  const taxTooltip = useTooltip({});

  // manufactured-to-delivery 훅 사용 (생산완료에서 납품)
  const { manufacturedToDelivery, isLoading: isManufacturedToDeliveryLoading } =
    useManufacturedToDelivery();

  // store에서 함수들 가져오기
  const handleChangeStatus = usePageStatusStore(
    (state) => state.handleChangeStatus
  );
  const handleProductionLogSave = usePageStatusStore(
    (state) => state.handleProductionLogSave
  );
  const setAddReturnModalOpen = usePageStatusStore(
    (state) => state.setAddReturnModalOpen
  );
  const deliveryData = usePageStatusStore((state) => state.deliveryData);
  const reloadProjectStatus = usePageStatusStore(
    (state) => state.reloadProjectStatus
  );

  // role, 구독 확인
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  // 툴팁 표시 조건 확인 (파트너스 구독이 아닐때)
  const shouldShowTooltip = !isPartnersSubscription();
  // 조건부 마우스 이벤트 핸들러
  const taxButtonMouseEvents = shouldShowTooltip
    ? {
        onMouseEnter: taxTooltip.onMouseEnter,
        onMouseLeave: taxTooltip.onMouseLeave,
      }
    : {};

  const productionPlanTab = tProduction('tabs.productionPlan');
  const orderDocumentTab = tProduction('tabs.orderDocument');
  const productionStatusTab = tProduction('tabs.productionStatus');
  const productionHistoryTab = tProduction('tabs.productionHistory');
  const deliveryTab = tProduction('tabs.delivery');

  const isProductionPlanSaveActive =
    productionTab === productionPlanTab &&
    pageStatus === 'pending' &&
    isProductionPlanValid;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const pathname = usePathname();
  const projectId = (() => {
    const match = pathname.match(/\/production\/(\d+)/);
    return match ? Number(match[1]) : undefined;
  })();

  if (pageStatus === 'completed') {
    return (
      <div className="flex gap-2">
        <MiniBtn
          text={t('switchToProgress')}
          variant="outline"
          onClick={() => {
            if (handleChangeStatus) {
              handleChangeStatus('delivery');
            }
          }}
          disabled={isViewer || !hasSubscription()}
        />
      </div>
    );
  }

  if (productionTab === orderDocumentTab) {
    return (
      <>
        <div className="relative" {...taxButtonMouseEvents}>
          <MiniBtn
            text={taxId ? t('viewTaxInvoice') : t('createTaxInvoice')}
            variant="outline"
            onClick={() => {
              if (
                isPartnersSubscription() &&
                ((!isViewer && role !== 'prod_manager') || taxId)
              ) {
                setIsTaxPanelOpen(true);
              }
            }}
            disabled={
              !isPartnersSubscription() ||
              ((isViewer || role === 'prod_manager') && !taxId)
            }
          />
          {taxTooltip.isVisible && shouldShowTooltip && (
            <div className="absolute z-50 top-12 -right-[120px] w-[350px]">
              <Tooltip
                text={t('upgradeTooltip')}
                color="white"
                position="right"
              />
            </div>
          )}
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
            initialClientData={projectStatusData?.quotations[0].client_info}
            initialProducts={projectStatusData?.quotations[0].products_info.map(
              (p) => ({
                productId: p.id,
                quantity: p.quantity,
                unit_price: p.unit_price,
                product_name: p.name,
                product_code: p.code,
                product_spec: p.spec,
              })
            )}
            onTaxCreated={async (_taxId) => {
              // 세금계산서 생성 후 프로젝트 상태 리로드하여 버튼 업데이트
              if (reloadProjectStatus) {
                await reloadProjectStatus();
              }
            }}
          />
        )}
      </>
    );
  }

  if (productionTab === productionPlanTab && pageStatus === 'pending') {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? t('viewTaxInvoice') : t('createTaxInvoice')}
              variant="outline"
              onClick={() => {
                if (
                  isPartnersSubscription() &&
                  ((!isViewer && role !== 'prod_manager') || taxId)
                ) {
                  setIsTaxPanelOpen(true);
                }
              }}
              disabled={
                !isPartnersSubscription() ||
                ((isViewer || role === 'prod_manager') && !taxId)
              }
            />
            {taxTooltip.isVisible && shouldShowTooltip && (
              <div className="absolute z-50 top-12 -right-[120px] w-[350px]">
                <Tooltip
                  text={t('upgradeTooltip')}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>
          <MiniBtn
            text={tCommon('next')}
            variant="secondary"
            onClick={onProductionPlanSaveClick}
            disabled={
              !isProductionPlanSaveActive || isViewer || !hasSubscription()
            }
          />
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
            initialClientData={projectStatusData?.quotations[0].client_info}
            initialProducts={projectStatusData?.quotations[0].products_info.map(
              (p) => ({
                productId: p.id,
                quantity: p.quantity,
                unit_price: p.unit_price,
                product_name: p.name,
                product_code: p.code,
                product_spec: p.spec,
              })
            )}
            onTaxCreated={async (_taxId) => {
              // 세금계산서 생성 후 프로젝트 상태 리로드하여 버튼 업데이트
              if (reloadProjectStatus) {
                await reloadProjectStatus();
              }
            }}
          />
        )}
      </>
    );
  }

  if (productionTab === productionPlanTab && pageStatus === 'production') {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? t('viewTaxInvoice') : t('createTaxInvoice')}
              variant="outline"
              onClick={() => {
                if (
                  isPartnersSubscription() &&
                  ((!isViewer && role !== 'prod_manager') || taxId)
                ) {
                  setIsTaxPanelOpen(true);
                }
              }}
              disabled={
                !isPartnersSubscription() ||
                ((isViewer || role === 'prod_manager') && !taxId)
              }
            />
            {taxTooltip.isVisible && shouldShowTooltip && (
              <div className="absolute z-50 top-12 -right-[120px] w-[350px]">
                <Tooltip
                  text={t('upgradeTooltip')}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>
          <MiniBtn
            text={tCommon('next')}
            variant="secondary"
            onClick={() => {
              if (handleChangeStatus) {
                handleChangeStatus('manufactured');
              }
            }}
            disabled={
              !isAllProductionCompleted || isViewer || !hasSubscription()
            }
          />
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
            initialClientData={projectStatusData?.quotations[0].client_info}
            initialProducts={projectStatusData?.quotations[0].products_info.map(
              (p) => ({
                productId: p.id,
                quantity: p.quantity,
                unit_price: p.unit_price,
                product_name: p.name,
                product_code: p.code,
                product_spec: p.spec,
              })
            )}
            onTaxCreated={async (_taxId) => {
              // 세금계산서 생성 후 프로젝트 상태 리로드하여 버튼 업데이트
              if (reloadProjectStatus) {
                await reloadProjectStatus();
              }
            }}
          />
        )}
      </>
    );
  }

  if (productionTab === productionStatusTab) {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? t('viewTaxInvoice') : t('createTaxInvoice')}
              variant="outline"
              onClick={() => {
                if (
                  isPartnersSubscription() &&
                  ((!isViewer && role !== 'prod_manager') || taxId)
                ) {
                  setIsTaxPanelOpen(true);
                }
              }}
              disabled={
                !isPartnersSubscription() ||
                ((isViewer || role === 'prod_manager') && !taxId)
              }
            />
            {taxTooltip.isVisible && shouldShowTooltip && (
              <div className="absolute z-50 top-12 -right-[120px] w-[350px]">
                <Tooltip
                  text={t('upgradeTooltip')}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>

          {isRefund && (
            <MiniBtn
              text={t('registerReturn')}
              variant="red"
              onClick={() => setAddReturnModalOpen(true)}
              disabled={isViewer || !hasSubscription()}
            />
          )}
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
            initialClientData={projectStatusData?.quotations[0].client_info}
            initialProducts={projectStatusData?.quotations[0].products_info.map(
              (p) => ({
                productId: p.id,
                quantity: p.quantity,
                unit_price: p.unit_price,
                product_name: p.name,
                product_code: p.code,
                product_spec: p.spec,
              })
            )}
            onTaxCreated={async (_taxId) => {
              // 세금계산서 생성 후 프로젝트 상태 리로드하여 버튼 업데이트
              if (reloadProjectStatus) {
                await reloadProjectStatus();
              }
            }}
          />
        )}
      </>
    );
  }

  if (productionTab === productionHistoryTab) {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? t('viewTaxInvoice') : t('createTaxInvoice')}
              variant="outline"
              onClick={() => {
                if (
                  isPartnersSubscription() &&
                  ((!isViewer && role !== 'prod_manager') || taxId)
                ) {
                  setIsTaxPanelOpen(true);
                }
              }}
              disabled={
                !isPartnersSubscription() ||
                ((isViewer || role === 'prod_manager') && !taxId)
              }
            />
            {taxTooltip.isVisible && shouldShowTooltip && (
              <div className="absolute z-50 top-12 -right-[120px] w-[350px]">
                <Tooltip
                  text={t('upgradeTooltip')}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>

          {pageStatus === 'manufactured' && (
            <MiniBtn
              text={tCommon('next')}
              variant="secondary"
              onClick={async () => {
                // 먼저 생산 내역 저장
                if (handleProductionLogSave) {
                  await handleProductionLogSave();
                }
                // 저장 완료 후 manufactured-to-delivery API 호출
                if (projectId) {
                  const result = await manufacturedToDelivery(projectId);
                  if (result.success) {
                    // 성공 시 페이지 상태 업데이트
                    if (handleChangeStatus) {
                      await handleChangeStatus('delivery');
                    }
                  } else {
                    console.error(
                      'manufactured-to-delivery 실패:',
                      result.error
                    );
                    alert(t('moveToDeliveryFailed'));
                  }
                }
              }}
              disabled={
                !isProductionLogValid ||
                !isAllProductionResultComplete ||
                isViewer ||
                !hasSubscription() ||
                isManufacturedToDeliveryLoading
              }
            />
          )}
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
            initialClientData={projectStatusData?.quotations[0].client_info}
            initialProducts={projectStatusData?.quotations[0].products_info.map(
              (p) => ({
                productId: p.id,
                quantity: p.quantity,
                unit_price: p.unit_price,
                product_name: p.name,
                product_code: p.code,
                product_spec: p.spec,
              })
            )}
            onTaxCreated={async (_taxId) => {
              // 세금계산서 생성 후 프로젝트 상태 리로드하여 버튼 업데이트
              if (reloadProjectStatus) {
                await reloadProjectStatus();
              }
            }}
          />
        )}
      </>
    );
  }

  if (productionTab === deliveryTab) {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? t('viewTaxInvoice') : t('createTaxInvoice')}
              variant="outline"
              onClick={() => {
                if (
                  isPartnersSubscription() &&
                  ((!isViewer && role !== 'prod_manager') || taxId)
                ) {
                  setIsTaxPanelOpen(true);
                }
              }}
              disabled={
                !isPartnersSubscription() ||
                ((isViewer || role === 'prod_manager') && !taxId)
              }
            />
            {taxTooltip.isVisible && shouldShowTooltip && (
              <div className="absolute z-50 top-12 -right-[120px] w-[350px]">
                <Tooltip
                  text={t('upgradeTooltip')}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>
          <MiniBtn
            text={t('registerReturn')}
            variant="red"
            onClick={() => setAddReturnModalOpen(true)}
            disabled={isViewer || !hasSubscription()}
          />
          {pageStatus === 'delivery' && (
            <MiniBtn
              text={t('moveToStorage')}
              variant="secondary"
              onClick={onMoveToStorageClick}
              disabled={
                isViewer ||
                !hasSubscription() ||
                !deliveryData ||
                deliveryData.some((item) => {
                  // delivery_date가 없거나 불완전한 형식이면 disabled
                  if (!item.delivery_date) return true;
                  // YYYY-MM-DD 형식인지 확인 (정확히 10자리)
                  return (
                    item.delivery_date.length !== 10 ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(item.delivery_date)
                  );
                })
              }
            />
          )}
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
            initialClientData={projectStatusData?.quotations[0].client_info}
            initialProducts={projectStatusData?.quotations[0].products_info.map(
              (p) => ({
                productId: p.id,
                quantity: p.quantity,
                unit_price: p.unit_price,
                product_name: p.name,
                product_code: p.code,
                product_spec: p.spec,
              })
            )}
            onTaxCreated={async (_taxId) => {
              // 세금계산서 생성 후 프로젝트 상태 리로드하여 버튼 업데이트
              if (reloadProjectStatus) {
                await reloadProjectStatus();
              }
            }}
          />
        )}
      </>
    );
  }

  // default
  return (
    <>
      <div className="flex items-center gap-1">
        <div
          className="flex items-center justify-center w-11 h-11 relative cursor-pointer hover:bg-bg rounded-lg"
          onClick={onNotificationClick}
        >
          <BellSimple size={20} className="text-dg" />
          {hasUnreadNotifications && (
            <span className="absolute top-[9px] left-[29px] w-1 h-1 bg-primary rounded-full " />
          )}
        </div>
        {/* 임시 주석처리: 파일 업로드 아이콘
        <div
          className="flex items-center justify-center w-11 h-11 cursor-pointer hover:bg-bg rounded-lg"
          onClick={onCloudUploadClick}
          title="파일 업로드"
        >
          <FilePlus size={20} className="text-dg" />
        </div>
        */}
        {/* 임시 주석처리: 챗봇(AI 어시스턴트) 아이콘
        <div
          className="flex items-center justify-center w-11 h-11 cursor-pointer hover:bg-bg rounded-lg"
          onClick={onNoraClick}
          title={t('aiAssistant')}
        >
          <ChatCircle size={20} className="text-dg" />
        </div>
        */}
        <div
          className="flex items-center justify-center w-10 h-10 cursor-pointer relative"
          onClick={() => setIsProfileModalOpen(true)}
        >
          <ProfileImage size="small" />

          {isProfileModalOpen && !pathname.includes('production') && (
            <div className="absolute top-14.5 right-0">
              <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TopBarContent;
