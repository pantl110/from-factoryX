import { MoneyWavy } from '@phosphor-icons/react';
import Title from '../title';
import AlarmItem from '../alarm-item';

const Rop = () => {
  return (
    <div className="flex flex-col gap-1 pt-4">
      <Title icon={<MoneyWavy />} title="ROP" count={2} />
      <AlarmItem
        chipText="자재가 부족해요!"
        chipVariant="red-secondary"
        name="자재명"
        subText="현재 재고 수량/ROP 기준 값"
        onClick={() => {}}
      />
      <AlarmItem
        chipText="자재가 부족해요!"
        chipVariant="red-secondary"
        name="자재명"
        subText="현재 재고 수량/ROP 기준 값"
        onClick={() => {}}
      />
    </div>
  );
};

export default Rop;
