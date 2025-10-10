import { MoneyWavy } from '@phosphor-icons/react';
import Title from '../title';
import AlarmItem from '../alarm-item';

const PaymentDue = () => {
  return (
    <div className="flex flex-col gap-1 pt-4">
      <Title icon={<MoneyWavy />} title="정산 현황" count={2} />
      <AlarmItem
        chipText="거래처의 입금이 2일째 지연되고 있어요!"
        chipVariant="red-secondary"
        name="업체명A"
        subText="약정입금일 · 총액"
        subChipText="매출"
        onClick={() => {}}
      />
      <AlarmItem
        chipText="우리 지급이 2일째 연체되고 있어요!"
        chipVariant="secondary"
        name="업체명A"
        subText="약정입금일 · 총액"
        subChipText="매입"
        onClick={() => {}}
      />
    </div>
  );
};

export default PaymentDue;
