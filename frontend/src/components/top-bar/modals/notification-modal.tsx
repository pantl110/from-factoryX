import Modal from '@/ui/modal/modal';
import MiniBtn from '@/ui/mini-btn';
import { NotificationResponseModel } from '@/types/data-model';
import { useMarkAllNotificationsRead } from '@/hooks';
import NotificationItem from './notification-item';

interface NotificationModalProps {
  onClose: () => void;
  notifications: NotificationResponseModel[];
  isLoading: boolean;
  setNotifications: React.Dispatch<
    React.SetStateAction<NotificationResponseModel[]>
  >;
}

const NotificationModal = ({
  onClose,
  notifications,
  isLoading,
  setNotifications,
}: NotificationModalProps) => {
  const { markAllAsRead, isLoading: isMarkAllLoading } =
    useMarkAllNotificationsRead();

  // 새 알림은 TopBar에서 실시간으로 처리됨

  // 모든 알림 읽음 처리
  const handleReadAll = async () => {
    const result = await markAllAsRead();
    if (result.success && result.data) {
      setNotifications(result.data);
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

  return (
    <Modal
      onClose={onClose}
      width="w-[463px]"
      height="h-[548px]"
      title="알림함"
      scroll={true}
      button={
        unreadCount === 0 ? null : (
          <MiniBtn
            height="h-8"
            text="모두 읽음"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={handleReadAll}
            disabled={isLoading || isMarkAllLoading}
          />
        )
      }
    >
      <div className="mt-3 mx-6 pb-6 h-[calc(100%-76px)] flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        {isLoading || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="Re_Body-1 text-gr">아직 알림이 없어요.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onRead={handleReadNotification}
              isMarkAllLoading={isMarkAllLoading}
            />
          ))
        )}
      </div>
    </Modal>
  );
};

export default NotificationModal;
