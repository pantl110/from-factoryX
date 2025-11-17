import { CalendarDots } from '@phosphor-icons/react';
import Title from '../title';
import AlarmItem from '../alarm-item';
import { useRouter } from 'next/navigation';

const Expiry = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-1 pt-4">
      <Title icon={<CalendarDots />} title="유통기한" count={2} />

      <AlarmItem
        chipText="유통기한이 얼마 남지 않았어요!"
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

export default Expiry;
