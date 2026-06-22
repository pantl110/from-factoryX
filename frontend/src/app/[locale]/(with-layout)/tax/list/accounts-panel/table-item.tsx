import { PaymentDetailResponseModel } from '@/types/data-model';
import { formatISODate } from '@/utils';
import { calculateOverdueDays } from './utils';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { IconBtn } from '@/ui';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

interface TableItemProps {
  item: PaymentDetailResponseModel;
  onOpenDeleteModal: (paymentId: number) => void;
  onOpenEditModal: (paymentDetail: PaymentDetailResponseModel) => void;
}

const TableItem = ({
  item,
  onOpenDeleteModal,
  onOpenEditModal,
}: TableItemProps) => {
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const expectedDate = item.expected_payment_date
    ? formatISODate(item.expected_payment_date)
    : '-';
  const paymentDate = formatISODate(item.payment_date);
  const amount = item.amount_received.toLocaleString();
  const outstandingAmount = item.outstanding_amount_at_payment.toLocaleString();

  // 입금일과 입금예정일을 비교하여 연체일수 계산
  const overdueDaysCount = calculateOverdueDays(
    item.payment_date,
    item.expected_payment_date
  );
  const overdueDays =
    overdueDaysCount > 0 ? `${overdueDaysCount}${tCommon('days')}` : '-';

  return (
    <div className="flex items-center border-b border-lg h-14 w-full text-bl Me_Body-3 cursor-default">
      <p className="flex-1 px-3 text-dg truncate" title={expectedDate}>
        {expectedDate}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={paymentDate}>
        {paymentDate}
      </p>
      <p
        className="flex-[1.2] px-3 text-dg truncate"
        title={`${amount}${tCommon('won')}`}
      >
        {amount}
        {tCommon('won')}
      </p>
      <p
        className="flex-[1.2] px-3 text-dg truncate"
        title={`${outstandingAmount}${tCommon('won')}`}
      >
        {outstandingAmount}
        {tCommon('won')}
      </p>
      <p
        className={`flex-1 px-3 truncate ${
          overdueDaysCount > 0 ? 'text-red' : 'text-dg'
        }`}
        title={overdueDays}
      >
        {overdueDays}
      </p>
      {!isViewer && hasSubscription() && (
        <div className="w-30 px-3 flex gap-2">
          <IconBtn
            icon={PencilSimple}
            size="w-9 h-9"
            iconSize={16}
            hoverBg={false}
            hoverText="text-primary"
            onClick={() => onOpenEditModal(item)}
          />
          <IconBtn
            icon={Trash}
            size="w-9 h-9"
            iconSize={16}
            hoverBg={false}
            hoverText={true}
            onClick={() => onOpenDeleteModal(item.id)}
          />
        </div>
      )}
    </div>
  );
};

export default TableItem;
