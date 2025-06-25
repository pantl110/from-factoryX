import Modal from "@/ui/modal";
import NotificationItem from "./notification-item";
import { notificationData } from "@/mocks/notification-data";
import MiniBtn from "@/ui/mini-btn";

interface NotificationModalProps {
  onClose: () => void;
}

const NotificationModal = ({ onClose }: NotificationModalProps) => {
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
        />
      }
    >
      <div className="h-[calc(100%-24px)] overflow-y-auto scrollbar-hide">
        {notificationData.map((item) => (
          <NotificationItem key={item.id} item={item} />
        ))}
      </div>
    </Modal>
  );
};

export default NotificationModal;
