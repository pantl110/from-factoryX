'use client';

import usePageStatusStore, { PageStatusModel } from '@/store/page-status-store';
import TopBarContent from './top-bar-content';
import NotificationModal from './modals/notification-modal';
import TopBarCrumb from './top-bar-crumb';
import { useState, useEffect } from 'react';
import { NotificationResponseModel } from '@/types/data-model';
import { useGetNotifications, useWebSocket } from '@/hooks';
import { NotificationType, NotificationCaseType } from '@/types/status-type';
import useAuthStore from '@/store/auth-store';
import { usePathname } from 'next/navigation';

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
  const setProductionTab = usePageStatusStore(
    (state) => state.setProductionTab
  );
  const setPageStatus = usePageStatusStore((state) => state.setPageStatus);
  const { getNotifications, isLoading: isLoadingNotifications } =
    useGetNotifications();

  const userInfo = useAuthStore((state) => state.userInfo);
  const pathname = usePathname();

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    NotificationResponseModel[]
  >([]);

  // 웹소켓으로 실시간 알림 상태 관리
  const { status: _wsStatus } = useWebSocket({
    onNewNotification: (notification) => {
      // 새 알림을 목록 맨 위에 추가
      const newNotification: NotificationResponseModel = {
        id: notification.id,
        receiver: userInfo?.member_id || 0, // 사용자의 memberId 사용
        type: notification.type as NotificationType,
        case: notification.case as NotificationCaseType,
        content: notification.content,
        is_read: false,
        created_at: notification.created_at,
        updated_at: notification.created_at,
      };

      setNotifications((prev) => [newNotification, ...prev]);
    },
  });

  // 알림 데이터 로드
  useEffect(() => {
    const loadNotifications = async () => {
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

  // 페이지 이동 시 production 관련 상태 초기화
  useEffect(() => {
    // production 페이지가 아닐 때 production 관련 상태 초기화
    if (!pathname.includes('/production/')) {
      setProductionTab(null);
      setPageStatus(null);
    }
  }, [pathname, setProductionTab, setPageStatus]);

  return (
    <>
      <header
        className={`fixed top-0 z-40 bg-white border-b border-lg transition-all duration-300 ease-in-out ${
          isSidebarVisible ? 'left-64 right-0' : 'left-0 right-0'
        }`}
      >
        <div className="relative h-[60px]">
          <div className="max-w-[1400px] min-w-[1000px] mx-auto px-10 flex items-center justify-between h-full">
            <TopBarCrumb
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
              hasUnreadNotifications={
                notifications.find((n) => !n.is_read) !== undefined
              }
            />
          </div>
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
