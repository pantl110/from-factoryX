'use client';

import MiniBtn from '@/ui/mini-btn';
import { BellSimple } from '@phosphor-icons/react';
import { ProductionTabType } from './types';
import ProfileImage from '@/ui/profile-image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import usePageStatusStore from '@/store/page-status-store';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import ProfileModal from './modals/profile-modal';
import TaxDetailPanel from '@/app/(with-layout)/tax/tax-detail-panel';
import Tooltip from '@/ui/tooltip';
import { useTooltip, useManufacturedToDelivery } from '@/hooks';

interface TopBarContentProps {
  productionTab: ProductionTabType | null;
  pageStatus: string | null;
  hasUnreadNotifications: boolean;
  onProductionPlanSaveClick?: () => void;
  onMoveToStorageClick?: () => void;
  onNotificationClick?: () => void;
}

const TopBarContent = ({
  productionTab,
  pageStatus,
  hasUnreadNotifications,
  onProductionPlanSaveClick,
  onMoveToStorageClick,
  onNotificationClick,
}: TopBarContentProps) => {
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

  const isProductionPlanSaveActive =
    productionTab === '생산 계획' &&
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
          text="진행 상태로 전환하기"
          variant="whiteOutline"
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

  if (productionTab === '주문서') {
    return (
      <>
        <div className="relative" {...taxButtonMouseEvents}>
          <MiniBtn
            text={taxId ? '세금계산서 보기' : '세금계산서 생성하기'}
            variant="whiteOutline"
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
                text={`Partners 플랜으로 업그레이드하면 
                  세무/회계 기능을 사용할 수 있어요.`}
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
          />
        )}
      </>
    );
  }

  if (productionTab === '생산 계획' && pageStatus === 'pending') {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? '세금계산서 보기' : '세금계산서 생성하기'}
              variant="whiteOutline"
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
                  text={`Partners 플랜으로 업그레이드하면 
                  세무/회계 기능을 사용할 수 있어요.`}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>
          <MiniBtn
            text="다음"
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
          />
        )}
      </>
    );
  }

  if (productionTab === '생산 계획' && pageStatus === 'production') {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? '세금계산서 보기' : '세금계산서 생성하기'}
              variant="whiteOutline"
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
                  text={`Partners 플랜으로 업그레이드하면 
                  세무/회계 기능을 사용할 수 있어요.`}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>
          <MiniBtn
            text="다음"
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
          />
        )}
      </>
    );
  }

  if (productionTab === '생산 현황') {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? '세금계산서 보기' : '세금계산서 생성하기'}
              variant="whiteOutline"
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
                  text={`Partners 플랜으로 업그레이드하면 
                  세무/회계 기능을 사용할 수 있어요.`}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>

          {isRefund && (
            <MiniBtn
              text="반품 등록하기"
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
          />
        )}
      </>
    );
  }

  if (productionTab === '생산 내역') {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? '세금계산서 보기' : '세금계산서 생성하기'}
              variant="whiteOutline"
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
                  text={`Partners 플랜으로 업그레이드하면 
                  세무/회계 기능을 사용할 수 있어요.`}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>

          {pageStatus === 'manufactured' && (
            <MiniBtn
              text="다음"
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
                    alert('납품 단계로 이동하는데 실패했습니다.');
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
          />
        )}
      </>
    );
  }

  if (productionTab === '납품') {
    return (
      <>
        <div className="flex gap-2">
          <div className="relative" {...taxButtonMouseEvents}>
            <MiniBtn
              text={taxId ? '세금계산서 보기' : '세금계산서 생성하기'}
              variant="whiteOutline"
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
                  text={`Partners 플랜으로 업그레이드하면 
                  세무/회계 기능을 사용할 수 있어요.`}
                  color="white"
                  position="right"
                />
              </div>
            )}
          </div>
          <MiniBtn
            text="반품 등록하기"
            variant="red"
            onClick={() => setAddReturnModalOpen(true)}
            disabled={isViewer || !hasSubscription()}
          />
          {pageStatus === 'delivery' && (
            <MiniBtn
              text="보관함으로 이동하기"
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
