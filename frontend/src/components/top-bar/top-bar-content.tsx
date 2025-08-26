'use client';

import MiniBtn from '@/ui/mini-btn';
import { BellSimple } from '@phosphor-icons/react';
import { ProductionTabType } from './types';
import ProfileImage from '@/ui/profile-image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import usePageStatusStore from '@/store/page-status-store';
import ProfileModal from './modals/profile-modal';
import TaxDetailPanel from '@/app/(with-layout)/tax/tax-detail-panel';

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
  ); // 모든 품목이 가동 완료 상태인지 여부
  const isProductionLogValid = usePageStatusStore(
    (state) => state.isProductionLogValid
  ); // 생산 내역 입력값이 유효한지 여부
  const projectStatusData = usePageStatusStore(
    (state) => state.projectStatusData
  );
  const isRefund = !!projectStatusData?.is_refunded; // 반품 여부
  const taxId = projectStatusData?.tax_invoice?.id || null; // 세금계산서 ID
  // 세금계산서 패널 상태
  const [isTaxPanelOpen, setIsTaxPanelOpen] = useState(false);

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
          text="진행 상태로 전환"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
          onClick={() => {
            if (handleChangeStatus) {
              handleChangeStatus('delivery');
            }
          }}
        />
      </div>
    );
  }

  if (productionTab === '주문서') {
    return (
      <>
        <MiniBtn
          text={taxId ? '세금계산서 보기' : '세금계산서 생성'}
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
          onClick={() => setIsTaxPanelOpen(true)}
        />
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
            initialClientData={projectStatusData?.quotations[0].client_info}
            initialProducts={projectStatusData?.quotations[0].products_info
              ?.filter((p) => p.productId != null)
              .map((p) => ({
                productId: Number(p.productId),
                quantity: Number(p.quantity ?? 0),
                unit_price: Number(p.unit_price ?? 0),
                products_info: [],
              }))}
          />
        )}
      </>
    );
  }

  if (productionTab === '생산 계획' && pageStatus === 'pending') {
    return (
      <>
        <div className="flex gap-2">
          <MiniBtn
            text={taxId ? '세금계산서 보기' : '세금계산서 생성'}
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={() => setIsTaxPanelOpen(true)}
          />
          <MiniBtn
            text="다음"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            onClick={onProductionPlanSaveClick}
            disabled={!isProductionPlanSaveActive}
          />
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
          />
        )}
      </>
    );
  }

  if (productionTab === '생산 계획' && pageStatus === 'production') {
    return (
      <>
        <div className="flex gap-2">
          <MiniBtn
            text={taxId ? '세금계산서 보기' : '세금계산서 생성'}
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={() => setIsTaxPanelOpen(true)}
          />
          <MiniBtn
            text="다음"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            onClick={() => {
              if (handleChangeStatus) {
                handleChangeStatus('manufactured');
              }
            }}
            disabled={!isAllProductionCompleted}
          />
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
          />
        )}
      </>
    );
  }

  if (productionTab === '생산 현황') {
    return (
      <>
        <div className="flex gap-2">
          <MiniBtn
            text={taxId ? '세금계산서 보기' : '세금계산서 생성'}
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={() => setIsTaxPanelOpen(true)}
          />

          {isRefund && (
            <MiniBtn
              text="반품 등록"
              textColor="text-red"
              bgColor="bg-red-8"
              hoverColor="hover:bg-red-hover"
              onClick={() => setAddReturnModalOpen(true)}
            />
          )}
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
          />
        )}
      </>
    );
  }

  if (productionTab === '생산 내역') {
    return (
      <>
        <div className="flex gap-2">
          <MiniBtn
            text={taxId ? '세금계산서 보기' : '세금계산서 생성'}
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={() => setIsTaxPanelOpen(true)}
          />
          {pageStatus === 'manufactured' && (
            <MiniBtn
              text="다음"
              textColor="text-primary"
              bgColor="bg-primary-8"
              hoverColor="hover:bg-secondary-hover"
              onClick={async () => {
                // 먼저 생산 내역 저장
                if (handleProductionLogSave) {
                  await handleProductionLogSave();
                }
                // 저장 완료 후 다음 단계로 진행
                if (handleChangeStatus) {
                  await handleChangeStatus('delivery');
                }
              }}
              disabled={!isProductionLogValid}
            />
          )}
        </div>
        {isTaxPanelOpen && (
          <TaxDetailPanel
            onClose={() => setIsTaxPanelOpen(false)}
            itemId={taxId || undefined}
            projectId={projectId}
          />
        )}
      </>
    );
  }

  if (productionTab === '납품') {
    return (
      <>
        <div className="flex gap-2">
          <MiniBtn
            text={taxId ? '세금계산서 보기' : '세금계산서 생성'}
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={() => setIsTaxPanelOpen(true)}
          />
          <MiniBtn
            text="반품 등록"
            textColor="text-red"
            bgColor="bg-red-8"
            hoverColor="hover:bg-red-hover"
            onClick={() => setAddReturnModalOpen(true)}
          />
          {pageStatus === 'delivery' && (
            <MiniBtn
              text="보관함으로 이동"
              textColor="text-primary"
              bgColor="bg-primary-8"
              hoverColor="hover:bg-secondary-hover"
              onClick={onMoveToStorageClick}
              disabled={
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

      {/* {isTaxPanelOpen && (
        <TaxDetailPanel
          onClose={() => setIsTaxPanelOpen(false)}
          itemId={taxId || undefined}
          projectId={projectId}
        />
      )} */}
    </>
  );
};

export default TopBarContent;
