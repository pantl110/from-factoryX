"use client";

import MiniBtn from "@/ui/mini-btn";
import { BellSimple, User } from "@phosphor-icons/react";
import { notificationData } from "@/mocks/notification-data";

interface TopBarContentProps {
  selectedTab: string | null;
  pageStatus: string | null;
  onProductionPlanSaveClick?: () => void;
  onAddReturnClick?: () => void;
  onMoveToStorageClick?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

const TopBarContent = ({
  selectedTab,
  pageStatus,
  onProductionPlanSaveClick,
  onAddReturnClick,
  onMoveToStorageClick,
  onNotificationClick,
  onProfileClick,
}: TopBarContentProps) => {
  const isProductionPlanSaveActive =
    selectedTab === "생산 계획" && pageStatus === "생산 대기";

  if (pageStatus === "프로젝트 완료") {
    return (
      <div className="flex gap-2">
        <MiniBtn
          text="다시 진행하기"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
        />
      </div>
    );
  }

  if (selectedTab === "주문서" || selectedTab === "생산 현황") {
    return null;
  }

  if (selectedTab === "생산 계획") {
    return (
      <div className="flex">
        <MiniBtn
          text="다음 단계"
          textColor="text-primary"
          bgColor="bg-primary-8"
          hoverColor="hover:bg-secondary-hover"
          onClick={onProductionPlanSaveClick}
          disabled={!isProductionPlanSaveActive}
        />
      </div>
    );
  }

  if (selectedTab === "생산 내역") {
    if (pageStatus === "생산 완료") {
      return (
        <div className="flex">
          <MiniBtn
            text="다음단계"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
          />
        </div>
      );
    }
    return null;
  }

  if (selectedTab === "납품") {
    return (
      <div className="flex gap-2">
        <MiniBtn
          text="반품 등록"
          textColor="text-red"
          bgColor="bg-red-8"
          hoverColor="hover:bg-red-hover"
          onClick={onAddReturnClick}
        />
        <MiniBtn
          text="보관함으로 이동"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
          onClick={onMoveToStorageClick}
        />
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
        {notificationData.length > 0 && (
          <span className="absolute top-[9px] left-[29px] w-1 h-1 bg-primary rounded-full " />
        )}
      </div>
      <div
        className="flex items-center justify-center w-10 h-10"
        onClick={onProfileClick}
      >
        <div className="flex items-center justify-center rounded-full w-8 h-8 bg-primary-8 border border-primary Me_Body-3 text-primary text-[12px] cursor-pointer">
          JG
        </div>
      </div>
    </div>
  );
};

export default TopBarContent;
