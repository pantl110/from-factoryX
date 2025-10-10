import Title from '../title';
import AlarmItem from '../alarm-item';
import { Package } from '@phosphor-icons/react';

const DueDate = () => {
  return (
    <div className="flex flex-col gap-1 pt-4">
      <Title icon={<Package />} title="납기 도래" count={3} />
      <AlarmItem
        chipText="납기일이 2일째 지났어요!"
        chipVariant="red-secondary"
        name="업체명A"
        subText="품목명(품목코드) · 수량"
        onClick={() => {}}
      />
      <AlarmItem
        chipText="오늘이 납품일이에요!"
        chipVariant="secondary"
        name="업체명A"
        subText="품목명(품목코드) · 수량"
        onClick={() => {}}
      />
      <AlarmItem
        chipText="D-5"
        chipVariant="outline"
        name="업체명A"
        subText="품목명(품목코드) · 수량"
        onClick={() => {}}
      />
    </div>
  );
};

export default DueDate;
