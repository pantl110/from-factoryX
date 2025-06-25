"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import usePageStatusStore, { PageStatusModel } from "@/store/page-status-store";
import TopBarContent from "./top-bar-content";
import { useState } from "react";
import NotificationModal from "./modals/notification-modal";
import ProfileModal from "./modals/profile-modal";

const TopBar = () => {
  const pageStatus = usePageStatusStore(
    (state: PageStatusModel) => state.pageStatus,
  );
  const selectedTab = usePageStatusStore((state) => state.selectedTab);
  const setProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.setProductionPlanSaveModalOpen,
  );
  const setAddReturnModalOpen = usePageStatusStore(
    (state) => state.setAddReturnModalOpen,
  );
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between w-full h-[60px] px-10">
        <div className="flex items-center gap-1">
          <p className="Re_Body-1 text-dg">프로젝트 관리</p>
          <CaretRight size={16} className="text-[#8c8c8c]" />
          <p className="Re_Body-1 text-dg">보관된 프로젝트</p>
        </div>
        <TopBarContent
          selectedTab={selectedTab}
          pageStatus={pageStatus}
          onProductionPlanSaveClick={() => setProductionPlanSaveModalOpen(true)}
          onAddReturnClick={() => setAddReturnModalOpen(true)}
          onNotificationClick={() => setIsNotificationModalOpen(true)}
          onProfileClick={() => setIsProfileModalOpen(true)}
        />
      </header>
      {isNotificationModalOpen && (
        <NotificationModal onClose={() => setIsNotificationModalOpen(false)} />
      )}
      {isProfileModalOpen && (
        <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}
    </>
  );
};

export default TopBar;
