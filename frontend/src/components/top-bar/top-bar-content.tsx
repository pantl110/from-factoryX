'use client';

import MiniBtn from '@/ui/mini-btn';
import { BellSimple } from '@phosphor-icons/react';
import { ProductionTabType } from './types';
import ProfileImage from '@/ui/profile-image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ProfileModal from './modals/profile-modal';
import usePageStatusStore from '@/store/page-status-store';

interface TopBarContentProps {
  productionTab: ProductionTabType | null;
  pageStatus: string | null;
  hasNotifications: boolean;
  onProductionPlanSaveClick?: () => void;
  onMoveToStorageClick?: () => void;
  onNotificationClick?: () => void;
}

const TopBarContent = ({
  productionTab,
  pageStatus,
  hasNotifications,
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
  const isRefund = usePageStatusStore((state) => state.isRefund); // 반품 여부

  // store에서 함수들 가져오기
  const handleChangeStatus = usePageStatusStore(
    (state) => state.handleChangeStatus
  );
  const setAddReturnModalOpen = usePageStatusStore(
    (state) => state.setAddReturnModalOpen
  );

  const isProductionPlanSaveActive =
    productionTab === '생산 계획' &&
    (pageStatus === 'pending' || pageStatus === '생산 대기') &&
    isProductionPlanValid;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const pathname = usePathname();

  if (pageStatus === 'completed' || pageStatus === '프로젝트 완료') {
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
      <MiniBtn
        text="세금계산서 생성"
        textColor="text-dg"
        borderColor="border-lg"
        hoverColor="hover:bg-bg"
      />
    );
  }

  if (productionTab === '생산 계획' && pageStatus === 'pending') {
    return (
      <div className="flex gap-2">
        <MiniBtn
          text="세금계산서 생성"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
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
    );
  }

  if (productionTab === '생산 계획' && pageStatus === 'production') {
    return (
      <div className="flex gap-2">
        <MiniBtn
          text="세금계산서 생성"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
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
    );
  }

  if (productionTab === '생산 현황') {
    return (
      <div className="flex gap-2">
        <MiniBtn
          text="세금계산서 생성"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
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
    );
  }

  if (productionTab === '생산 내역') {
    return (
      <div className="flex gap-2">
        <MiniBtn
          text="세금계산서 생성"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
        />
        {pageStatus === '생산 완료' && (
          <MiniBtn
            text="다음"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            onClick={() => {
              if (handleChangeStatus) {
                handleChangeStatus('delivery');
              }
            }}
          />
        )}
      </div>
    );
  }

  if (productionTab === '납품') {
    return (
      <div className="flex gap-2">
        <MiniBtn
          text="세금계산서 생성"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
        />
        <MiniBtn
          text="반품 등록"
          textColor="text-red"
          bgColor="bg-red-8"
          hoverColor="hover:bg-red-hover"
          onClick={() => setAddReturnModalOpen(true)}
        />
        {(pageStatus === '납품' || pageStatus === 'delivery') && (
          <MiniBtn
            text="보관함으로 이동"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            onClick={onMoveToStorageClick}
          />
        )}
      </div>
    );
  }

  // default
  return (
    <div className="flex items-center gap-1">
      <div
        className="flex items-center justify-center w-11 h-11 relative cursor-pointer hover:bg-bg rounded-lg"
        onClick={onNotificationClick}
      >
        <BellSimple size={20} className="text-dg" />
        {hasNotifications && (
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
  );
};

export default TopBarContent;
