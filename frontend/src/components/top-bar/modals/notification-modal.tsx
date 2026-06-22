import Modal from '@/ui/modal/modal';
import MiniBtn from '@/ui/mini-btn';
import { NotificationResponseModel } from '@/types/data-model';
import { useMarkAllNotificationsRead, useInfiniteScroll } from '@/hooks';
import NotificationItem from './notification-item';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';

interface NotificationModalProps {
  onClose: () => void;
  notifications: NotificationResponseModel[];
  isLoading: boolean;
  setNotifications: React.Dispatch<
    React.SetStateAction<NotificationResponseModel[]>
  >;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onResetPagination?: () => void;
}

const NotificationModal = ({
  onClose,
  notifications,
  isLoading,
  setNotifications,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onResetPagination,
}: NotificationModalProps) => {
  const t = useTranslations('notification');
  const { markAllAsRead, isLoading: isMarkAllLoading } =
    useMarkAllNotificationsRead();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 새 알림은 TopBar에서 실시간으로 처리됨

  // 모든 알림 읽음 처리
  const handleReadAll = async () => {
    const result = await markAllAsRead();
    if (result.success && result.data) {
      setNotifications(result.data);
      // 페이지네이션 상태 초기화 (전체 알림을 다시 로드했으므로)
      onResetPagination?.();
    }
  };

  // 개별 알림 읽음 처리
  const handleReadNotification = (id: number) => {
    setNotifications((prev: NotificationResponseModel[]) =>
      prev.map((notification: NotificationResponseModel) =>
        notification.id === id
          ? { ...notification, is_read: true }
          : notification
      )
    );
  };

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // 무한스크롤을 위한 ref
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: true,
    hasMore,
    isLoading,
    isFetchingMore: isLoadingMore,
    onLoadMore,
  });

  return (
    <Modal
      onClose={onClose}
      width="w-[463px]"
      height="h-[548px]"
      title={t('title')}
      scroll={true}
      button={
        unreadCount === 0 ? null : (
          <MiniBtn
            variant="outline"
            height="h-8"
            text={t('markAllAsRead')}
            onClick={handleReadAll}
            disabled={isLoading || isMarkAllLoading}
          />
        )
      }
    >
      <div
        ref={scrollContainerRef}
        className="mt-3 mx-6 pb-6 h-[calc(100%-76px)] flex flex-col gap-1 overflow-y-auto scrollbar-hide"
      >
        {notifications.length === 0 && !isLoadingMore ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="Re_Body-1 text-gr">{t('noNotifications')}</p>
          </div>
        ) : (
          <>
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onRead={handleReadNotification}
                isMarkAllLoading={isMarkAllLoading}
              />
            ))}
            {/* 무한스크롤 트리거 요소 */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-2 flex justify-center">
                {isLoadingMore && <p className="Re_Body-2 text-gr">...</p>}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default NotificationModal;
