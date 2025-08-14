import Modal from '@/ui/modal/modal';
import NotificationItem from './notification-item';
import MiniBtn from '@/ui/mini-btn';
import { NotificationResponseModel } from '@/types/data-model';
import { useMarkAllNotificationsRead } from '@/hooks';
// import { useWebSocket } from '@/hooks/websocket/use-websocket';
// import { NotificationType, NotificationCaseType } from '@/types/status-type';

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

  // 웹소켓 연결 및 새 알림 처리 (잠시 비활성화)
  // const { status } = useWebSocket({
  //   onNewNotification: (notification) => {
  //     // 새 알림을 목록 맨 위에 추가
  //     const newNotification: NotificationResponseModel = {
  //       id: notification.id,
  //       receiver: 0, // FactoryMember ID (백엔드에서 제공하는 정보에 맞게 수정 필요)
  //       type: notification.type as NotificationType,
  //       case: notification.case as NotificationCaseType,
  //       content: notification.content,
  //       is_read: false,
  //       created_at: notification.created_at,
  //       updated_at: notification.created_at, // 새 알림이므로 created_at과 동일
  //     };

  //     setNotifications((prev) => [newNotification, ...prev]);
  //   },
  // });

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
        {isLoading || notifications.length === 0
          ? null
          : notifications.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onRead={handleReadNotification}
                isMarkAllLoading={isMarkAllLoading}
              />
            ))}
      </div>
    </Modal>
  );
};

export default NotificationModal;
