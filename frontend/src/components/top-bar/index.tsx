'use client';

import usePageStatusStore, { PageStatusModel } from '@/store/page-status-store';
import TopBarContent from './top-bar-content';
import NotificationModal from './modals/notification-modal';
import TopBarCrumb from './top-bar-crumb';
import { useState, useEffect } from 'react';
import { NotificationResponseModel } from '@/types/data-model';
import { useGetNotifications } from '@/hooks';

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
  const { getNotifications, isLoading: isLoadingNotifications } =
    useGetNotifications();

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    NotificationResponseModel[]
  >([]);

  // 알림 데이터 로드
  useEffect(() => {
    const loadNotifications = async () => {
      // ‼️‼️‼️‼️‼️‼️‼️‼️ 페이지네이션 없는지 확인
      // 먼저 첫 페이지를 작은 크기로 호출하여 totalCount 확인
      const initialResult = await getNotifications(1, 10);
      if (initialResult.success && initialResult.data) {
        const totalCount = initialResult.data.totalCnt;

        // totalCount가 있으면 전체 알림을 한 번에 로드
        if (totalCount > 0) {
          const fullResult = await getNotifications(1, totalCount);
          if (fullResult.success && fullResult.data) {
            setNotifications(fullResult.data.data);
          }
        } else {
          // totalCount가 0이면 빈 배열 설정
          setNotifications([]);
        }
      }
    };

    loadNotifications();
  }, [getNotifications]);

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
            hasNotifications={notifications.length > 0}
          />
        </div>
      </header>

      {isNotificationModalOpen && (
        <NotificationModal
          onClose={() => setIsNotificationModalOpen(false)}
          notifications={notifications}
          isLoading={isLoadingNotifications}
          setNotifications={setNotifications}
        />
      )}
    </>
  );
};

export default TopBar;
