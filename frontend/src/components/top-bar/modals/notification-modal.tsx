import Modal from '@/ui/modal/modal';
import NotificationItem from './notification-item';
import { notificationData } from '@/mocks/notification-data';
import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';
import { NotificationModel } from '../types';

interface NotificationModalProps {
  onClose: () => void;
}

const NotificationModal = ({ onClose }: NotificationModalProps) => {
  const [notifications, setNotifications] =
    useState<NotificationModel[]>(notificationData);

  // 개별 알림 읽음 처리
  const handleReadNotification = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // 모든 알림 읽음 처리
  const handleReadAll = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal
      onClose={onClose}
      width="w-[463px]"
      height="h-[548px]"
      title="알림함"
      button={
        unreadCount === 0 ? null : (
          <MiniBtn
            height="h-8"
            text="모두 읽음"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={handleReadAll}
            disabled={unreadCount === 0}
          />
        )
      }
    >
      <div className="mt-3 h-[calc(100%-52px)] flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        {notifications.map((item) => (
          <NotificationItem
            key={item.id}
            item={item}
            onRead={() => handleReadNotification(item.id)}
          />
        ))}
      </div>
    </Modal>
  );
};

export default NotificationModal;
