import { PaymentDetailResponseModel } from '@/types/data-model';
import { formatISODate } from '@/utils';
import { calculateOverdueDays } from './utils';

interface TableItemProps {
  item: PaymentDetailResponseModel;
}

const TableItem = ({ item }: TableItemProps) => {
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
  const overdueDays = overdueDaysCount > 0 ? `${overdueDaysCount}일` : '-';

  return (
    <div className="flex items-center border-b border-lg h-14 w-full text-bl Me_Body-1">
      <p className="flex-1 px-3 text-dg truncate" title={expectedDate}>
        {expectedDate}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={paymentDate}>
        {paymentDate}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={`${amount}원`}>
        {amount}원
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={`${outstandingAmount}원`}
      >
        {outstandingAmount}원
      </p>
      <p
        className={`flex-1 px-3 truncate ${
          overdueDaysCount > 0 ? 'text-red' : 'text-dg'
        }`}
        title={overdueDays}
      >
        {overdueDays}
      </p>
    </div>
  );
};

export default TableItem;
