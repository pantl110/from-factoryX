"use client";

import usePageStatusStore, { PageStatusModel } from "@/store/page-status-store";
import TopBarContent from "./top-bar-content";
import { useState } from "react";
import NotificationModal from "./modals/notification-modal";
import ProfileModal from "./modals/profile-modal";
import TopBarCrumb from "./top-bar-crumb";
import { usePathname } from "next/navigation";

interface TopBarProps {
  isSidebarVisible: boolean;
}

const TopBar = ({ isSidebarVisible }: TopBarProps) => {
  const pageStatus = usePageStatusStore(
    (state: PageStatusModel) => state.pageStatus,
  );

  const productionTab = usePageStatusStore((state) => state.productionTab);
  const stockTab = usePageStatusStore((state) => state.stockTab);
  const settingTab = usePageStatusStore((state) => state.settingTab);
  const settingChip = usePageStatusStore((state) => state.settingChip);
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
  const pathname = usePathname();

  return (
    <>
      <header
        className={`${
          isSidebarVisible ? "w-[calc(100%-256px)]" : "w-full"
        } fixed z-40 bg-white border-b border-[#eeeeee] transition-width duration-300`}
      >
        <div className="max-w-[1400px] min-w-[1000px] mx-auto px-10 flex items-center justify-between h-[60px]">
          <TopBarCrumb
            pageStatus={pageStatus || ""}
            productionTab={productionTab || undefined}
            stockTab={stockTab || undefined}
            settingTab={settingTab || undefined}
            settingChip={settingChip || undefined}
          />

          <TopBarContent
            pageStatus={pageStatus}
            productionTab={productionTab}
            onProductionPlanSaveClick={() =>
              setProductionPlanSaveModalOpen(true)
            }
            onAddReturnClick={() => setAddReturnModalOpen(true)}
            onMoveToStorageClick={() => setMoveToStorageModalOpen(true)}
            onNotificationClick={() => setIsNotificationModalOpen(true)}
            onProfileClick={() => setIsProfileModalOpen(true)}
          />

          {isProfileModalOpen && !pathname.includes("production") && (
            <div className="absolute top-17 right-10">
              <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {isNotificationModalOpen && (
        <NotificationModal onClose={() => setIsNotificationModalOpen(false)} />
      )}
    </>
  );
};

export default TopBar;
