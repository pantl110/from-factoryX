import Modal from "@/ui/modal/modal";
import NotificationItem from "./notification-item";
import { notificationData } from "@/mocks/notification-data";
import MiniBtn from "@/ui/mini-btn";
import { useState } from "react";

interface NotificationModalProps {
  onClose: () => void;
}

const NotificationModal = ({ onClose }: NotificationModalProps) => {
  const [isReadAll, setIsReadAll] = useState(false);
  return (
    <Modal
      onClose={onClose}
      width="w-[463px]"
      height="h-[548px]"
      title="알림함"
      button={
        <MiniBtn
          height="h-8"
          text="모두 읽음"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="hover:bg-bg"
          onClick={() => setIsReadAll(true)}
        />
      }
    >
      <div className="h-[calc(100%-24px)] overflow-y-auto scrollbar-hide">
        {notificationData.map((item) => (
          <NotificationItem key={item.id} item={item} isReadAll={isReadAll} />
        ))}
      </div>
    </Modal>
  );
};

export default NotificationModal;
