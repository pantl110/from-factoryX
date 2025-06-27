import { NotificationModel } from "../types";
import { ExclamationMark, CheckSquare, Info } from "@phosphor-icons/react";

interface NotificationItemProps {
  item: NotificationModel;
}
const NotificationItem = ({ item }: NotificationItemProps) => {
  let icon = null;

  switch (item.type) {
    case "materialShortage":
      icon = <ExclamationMark size={24} weight="fill" className="text-red" />;
      break;
    case "importDelay":
      icon = <ExclamationMark size={24} weight="fill" className="text-red" />;
      break;
    case "deliveryDate":
      icon = <ExclamationMark size={24} weight="fill" className="text-red" />;
      break;
    case "return":
      icon = <ExclamationMark size={24} weight="fill" className="text-red" />;
      break;
    case "taxIssue":
      icon = <CheckSquare size={24} className="text-primary" weight="fill" />;
      break;
    case "debt":
      icon = <Info size={24} className="text-sv" weight="fill" />;
      break;
    case "scheduleConflict":
      icon = <Info size={24} className="text-sv" weight="fill" />;
      break;

    default:
      icon = <Info size={24} className="text-sv" weight="fill" />;
  }

  return (
    <div className="w-full my-3 rounded ">
      <div className="flex gap-2 items-center">
        <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
        <p className="Me_Body-2 text-dg">{item.message}</p>
      </div>
      <p className="px-7 Me_Body-2 text-gr">{item.date}</p>
    </div>
  );
};

export default NotificationItem;
