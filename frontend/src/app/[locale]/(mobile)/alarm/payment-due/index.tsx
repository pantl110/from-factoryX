import { MoneyWavy } from '@phosphor-icons/react';
import Title from '../title';
import AlarmItem from '../alarm-item';
import { useRouter } from '@/i18n/navigation';

const PaymentDue = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1 pt-4">
      <Title icon={<MoneyWavy />} title="정산 현황" count={2} />
      <AlarmItem
        chipText="거래처의 입금이 2일째 지연되고 있어요!"
        chipVariant="red-secondary"
        name="거래처명A"
        subText="약정입금일 · 총액"
        subChipText="매출"
        onClick={() => router.push('/account?type=income')}
      />
      <AlarmItem
        chipText="우리 지급이 2일째 연체되고 있어요!"
        chipVariant="secondary"
        name="거래처명A"
        subText="약정입금일 · 총액"
        subChipText="매입"
        onClick={() => router.push('/account?type=outcome')}
      />
    </div>
  );
};

export default PaymentDue;
