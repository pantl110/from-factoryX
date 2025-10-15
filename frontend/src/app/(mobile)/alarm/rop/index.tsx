import { MoneyWavy } from '@phosphor-icons/react';
import Title from '../title';
import AlarmItem from '../alarm-item';
import { useRouter } from 'next/navigation';

const Rop = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-1 pt-4">
      <Title icon={<MoneyWavy />} title="ROP" count={2} />
      <AlarmItem
        chipText="자재가 부족해요!"
        chipVariant="red-secondary"
        name="자재명"
        subText="현재 재고 수량/ROP 기준 값"
        onClick={() => {
          router.push('/material');
        }}
      />
      <AlarmItem
        chipText="자재가 부족해요!"
        chipVariant="red-secondary"
        name="자재명"
        subText="현재 재고 수량/ROP 기준 값"
        onClick={() => {
          router.push('/material');
        }}
      />
    </div>
  );
};

export default Rop;
