'use client';

import usePageStatusStore, { PageStatusModel } from '@/store/page-status-store';
import TopBarContent from './top-bar-content';
import { useState } from 'react';
import NotificationModal from './modals/notification-modal';
import TopBarCrumb from './top-bar-crumb';

interface TopBarProps {
  isSidebarVisible: boolean;
}

const TopBar = ({ isSidebarVisible }: TopBarProps) => {
  const pageStatus = usePageStatusStore(
    (state: PageStatusModel) => state.pageStatus
  );

  const productionTab = usePageStatusStore((state) => state.productionTab);
  const stockTab = usePageStatusStore((state) => state.stockTab);
  const settingTab = usePageStatusStore((state) => state.settingTab);
  const settingChip = usePageStatusStore((state) => state.settingChip);
  const setProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.setProductionPlanSaveModalOpen
  );

  const setMoveToStorageModalOpen = usePageStatusStore(
    (state) => state.setMoveToStorageModalOpen
  );
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  return (
    <>
      <header
        className={`${
          isSidebarVisible ? 'w-[calc(100%-256px)]' : 'w-full'
        } fixed z-40 bg-white border-b border-lg transition-width duration-300`}
      >
        <div className="max-w-[1400px] min-w-[1000px] mx-auto px-10 flex items-center justify-between h-[60px]">
          <TopBarCrumb
            pageStatus={pageStatus || ''}
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
            onMoveToStorageClick={() => setMoveToStorageModalOpen(true)}
            onNotificationClick={() => setIsNotificationModalOpen(true)}
          />
        </div>
      </header>

      {isNotificationModalOpen && (
        <NotificationModal onClose={() => setIsNotificationModalOpen(false)} />
      )}
    </>
  );
};

export default TopBar;
