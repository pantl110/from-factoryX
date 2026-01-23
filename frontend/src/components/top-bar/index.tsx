'use client';

import usePageStatusStore, { PageStatusModel } from '@/store/page-status-store';
import TopBarContent from './top-bar-content';
import NotificationModal from './modals/notification-modal';
import TopBarCrumb from './top-bar-crumb';
import NoraModal from './nora-modal';
import CloudUploadModal from './modals/cloud-upload-modal';
import { useState, useEffect, useCallback } from 'react';
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
  const [isNoraOpen, setIsNoraOpen] = useState(false);
  const [isCloudUploadModalOpen, setIsCloudUploadModalOpen] = useState(false);
  const [noraModalSize, setNoraModalSize] = useState<{
    width?: number;
    height?: number;
  }>({});

  const handleNoraSizeChange = useCallback((width: number, height: number) => {
    setNoraModalSize({ width, height });
  }, []);

  const [notifications, setNotifications] = useState<
    NotificationResponseModel[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const NOTIFICATION_PAGE_SIZE = 10;

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

  // 알림 데이터 로드 (초기 로드)
  useEffect(() => {
    const loadNotifications = async () => {
      // 처음에는 첫 페이지만 로드 (10개)
      const initialResult = await getNotifications(1, NOTIFICATION_PAGE_SIZE);
      if (initialResult.success && initialResult.data) {
        setNotifications(initialResult.data.data || []);
        const pageCnt = initialResult.data.pageCnt || 1;
        setHasMore(pageCnt > 1);
        setCurrentPage(1);
      } else {
        setNotifications([]);
        setHasMore(false);
      }
    };

    loadNotifications();
  }, [getNotifications]);

  // 추가 페이지 로드 함수
  const loadMoreNotifications = async () => {
    if (isLoadingMore || !hasMore || isLoadingNotifications) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const result = await getNotifications(nextPage, NOTIFICATION_PAGE_SIZE);

    if (result.success && result.data) {
      const newNotifications = result.data.data || [];
      setNotifications((prev) => [...prev, ...newNotifications]);
      setCurrentPage(nextPage);
      setHasMore(nextPage < (result.data.pageCnt || 1));
    }

    setIsLoadingMore(false);
  };

  // 페이지네이션 상태 초기화 함수
  // markAllAsRead가 전체 알림을 반환하므로, 전체를 표시하고 페이지네이션 상태 초기화
  const resetPagination = () => {
    // 전체 알림이 이미 setNotifications로 설정되었으므로
    // 페이지네이션 상태만 초기화 (전체가 이미 로드되었으므로 hasMore는 false)
    const totalCount = notifications.length;
    const pageCnt = Math.ceil(totalCount / NOTIFICATION_PAGE_SIZE);
    setCurrentPage(pageCnt); // 마지막 페이지로 설정
    setHasMore(false); // 전체가 이미 로드되었으므로 더 이상 로드할 필요 없음
    setIsLoadingMore(false);
  };

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
        className={`fixed top-0 z-40 bg-wh border-b border-lg transition-all duration-300 ease-in-out ${
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
              onNoraClick={() => setIsNoraOpen(true)}
              onCloudUploadClick={() => setIsCloudUploadModalOpen(true)}
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
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMoreNotifications}
          onResetPagination={resetPagination}
        />
      )}

      {isNoraOpen && (
        <NoraModal
          onClose={() => setIsNoraOpen(false)}
          initialWidth={noraModalSize.width}
          initialHeight={noraModalSize.height}
          onSizeChange={handleNoraSizeChange}
        />
      )}

      {isCloudUploadModalOpen && (
        <CloudUploadModal onClose={() => setIsCloudUploadModalOpen(false)} />
      )}
    </>
  );
};

export default TopBar;
