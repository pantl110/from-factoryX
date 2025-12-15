import MiniBtn from '@/ui/mini-btn';
import { NotificationResponseModel } from '@/types/data-model';
import { NotificationCaseType } from '@/types/status-type';
import { Siren, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { useGetNotificationDetail } from '@/hooks';
import { formatISODate } from '@/utils';

interface NotificationItemProps {
  item: NotificationResponseModel;
  onRead: (notificationId: number) => void;
  isMarkAllLoading: boolean;
}

const NotificationItem = ({
  item,
  onRead,
  isMarkAllLoading,
}: NotificationItemProps) => {
  const { getNotificationDetail, isLoading: isDetailLoading } =
    useGetNotificationDetail();

  // 개별 알림 읽음 처리
  const handleRead = async () => {
    const result = await getNotificationDetail(item.id);
    if (result.success && result.data) {
      // 읽음 처리 성공 시 부모에게 알림
      onRead(item.id);
    }
  };

  // 알림 타입별 아이콘과 색상 매핑
  const getNotificationIcon = (notificationCase: NotificationCaseType) => {
    const iconConfig = {
      // 경고/오류 (빨간색)
      warning: { icon: WarningCircle, color: 'text-red' },
      // 성공/완료 (파란색)
      completed: { icon: CheckCircle, color: 'text-primary' },
      // 정보/알림 (회색)
      information: { icon: Siren, color: 'text-gr' },
    };

    // 타입별 그룹 분류
    const warningTypes = ['material_lack', 'project_warning'];
    const completedTypes = [
      'product_completed',
      'sales_tax_invoice_published',
      'purchase_tax_invoice_published',
      'cash_receipt_published',
    ];
    const infoTypes = [
      'permission_changed',
      'due_date_approaching',
      'production_schedule_changed',
    ];

    let config;
    if (warningTypes.includes(notificationCase)) {
      config = iconConfig.warning;
    } else if (completedTypes.includes(notificationCase)) {
      config = iconConfig.completed;
    } else if (infoTypes.includes(notificationCase)) {
      config = iconConfig.information;
    } else {
      config = iconConfig.information;
    }

    const IconComponent = config.icon;
    return <IconComponent size={24} weight="fill" className={config.color} />;
  };

  const icon = getNotificationIcon(item.case);

  return (
    <div className="w-full my-3 rounded flex justify-between">
      <div>
        <div className="flex gap-2">
          <div className="h-[29px] flex items-center justify-center">
            {icon}
          </div>
          <p className={`Me_Body-2 ${item.is_read ? 'text-sv' : 'text-dg'}`}>
            {item.content}
          </p>
        </div>
        <p className="Me_Body-2 text-gr">{formatISODate(item.created_at)}</p>
      </div>
      {!item.is_read && (
        <div className="shrink-0 ml-2">
          <MiniBtn
            text="읽음"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            height="h-8"
            onClick={handleRead}
            disabled={isMarkAllLoading || isDetailLoading}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
