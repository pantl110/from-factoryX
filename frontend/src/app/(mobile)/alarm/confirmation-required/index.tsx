import { CalendarDots } from '@phosphor-icons/react';
import Title from '../title';
import AlarmItem from '../alarm-item';

const ConfirmationRequired = () => {
  return (
    <div className="flex flex-col gap-1 pt-4">
      <Title icon={<CalendarDots />} title="확정 필요 주문" count={1} />

      <AlarmItem
        chipText="주문이 8일째 확정 상태예요!"
        chipVariant="secondary"
        name="업체명A"
        subText="품목명 외 2개"
        onClick={() => {}}
      />
    </div>
  );
};

export default ConfirmationRequired;
