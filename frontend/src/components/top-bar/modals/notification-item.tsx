import MiniBtn from "@/ui/mini-btn";
import { NotificationModel } from "../types";
import { ExclamationMark, CheckSquare, Siren } from "@phosphor-icons/react";

interface NotificationItemProps {
  item: NotificationModel;
  onRead: () => void;
}

const NotificationItem = ({ item, onRead }: NotificationItemProps) => {
  // 알림 타입별 아이콘과 색상 매핑
  const getNotificationIcon = (type: string) => {
    const iconConfig = {
      // 경고/오류 (빨간색)
      warning: { icon: ExclamationMark, color: "text-red" },
      // 성공/완료 (파란색)
      completed: { icon: CheckSquare, color: "text-primary" },
      // 정보/알림 (회색)
      info: { icon: Siren, color: "text-gr" },
    };

    // 타입별 그룹 분류
    const warningTypes = [
      "materialShortage",
      "facilityIssue",
      "productionIssue",
    ];
    const completedTypes = [
      "productionComplete",
      "salesTaxIssued",
      "purchaseTaxReceived",
      "receiptReceived",
    ];
    const infoTypes = ["roleChanged", "deliveryDate", "productionPlanChanged"];

    let config;
    if (warningTypes.includes(type)) {
      config = iconConfig.warning;
    } else if (completedTypes.includes(type)) {
      config = iconConfig.completed;
    } else if (infoTypes.includes(type)) {
      config = iconConfig.info;
    } else {
      config = iconConfig.info;
    }

    const IconComponent = config.icon;
    return <IconComponent size={24} weight="fill" className={config.color} />;
  };

  const icon = getNotificationIcon(item.type);

  return (
    <div className="w-full my-3 rounded">
      <div className="flex gap-2 items-center">
        {icon}
        <p className={`Me_Body-2 ${item.isRead ? "text-sv" : "text-dg"}`}>
          {item.message}
        </p>
      </div>

      <div className="flex justify-between pl-8 pr-3 h-8 items-end">
        <p className="Me_Body-2 text-gr">{item.date}</p>
        {!item.isRead && (
          <MiniBtn
            text="읽음"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            height="h-8"
            onClick={onRead}
          />
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
