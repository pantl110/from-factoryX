"use client";

import usePageStatusStore, { PageStatusModel } from "@/store/page-status-store";
import TopBarContent from "./top-bar-content";
import { useState } from "react";
import NotificationModal from "./modals/notification-modal";
import ProfileModal from "./modals/profile-modal";
import TopBarCrumb from "./top-bar-crumb";

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
  const setMoveToStorageModalOpen = usePageStatusStore(
    (state) => state.setMoveToStorageModalOpen,
  );
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between w-full h-[60px] px-10 relative">
        <TopBarCrumb pageStatus={pageStatus || ""} />

        <TopBarContent
          selectedTab={selectedTab}
          pageStatus={pageStatus}
          onProductionPlanSaveClick={() => setProductionPlanSaveModalOpen(true)}
          onAddReturnClick={() => setAddReturnModalOpen(true)}
          onMoveToStorageClick={() => setMoveToStorageModalOpen(true)}
          onNotificationClick={() => setIsNotificationModalOpen(true)}
          onProfileClick={() => setIsProfileModalOpen(true)}
        />

        {isProfileModalOpen && (
          <div className="absolute top-17 right-0">
            <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
          </div>
        )}
      </header>

      {isNotificationModalOpen && (
        <NotificationModal onClose={() => setIsNotificationModalOpen(false)} />
      )}
    </>
  );
};

export default TopBar;
