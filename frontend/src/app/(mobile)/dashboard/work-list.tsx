import Image from 'next/image';
import onboardingImage from '@/assets/onboarding.png';
import { CaretDown } from '@phosphor-icons/react';
import IconBtn from '@/ui/icon-btn';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useState } from 'react';
import useMemberStore from '@/store/member-store';
import useAuthStore from '@/store/auth-store';

interface WorkListProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const WorkList = ({ selectedDate, setSelectedDate }: WorkListProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const role = useMemberStore((state) => state.role);
  const userInfo = useAuthStore((state) => state.userInfo);

  // 오늘 날짜 생성
  const today = new Date();

  // 선택된 날짜 포맷팅
  const formattedDate = selectedDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 오늘 포함 5일의 날짜 생성
  const getRecentDates = () => {
    const dates: Array<{ date: Date; formatted: string }> = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formatted = date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
      });
      dates.push({ date, formatted });
    }
    return dates;
  };

  const recentDates = getRecentDates();

  return (
    <div className="relative flex flex-col gap-3">
      <Image
        src={onboardingImage}
        alt="factory"
        width={79}
        height={63}
        className="absolute -top-[7px] right-[17px]"
      />

      <div className="flex flex-col gap-2">
        <div className="flex">
          <span className="m-Heading-3-semibold text-primary">
            {userInfo?.username}님
          </span>
          <span className="m-Heading-3-semibold">의</span>
        </div>
        <div className="flex gap-1.5 items-center w-fit relative">
          <p className="m-Heading-3b text-dg">{formattedDate}</p>
          <IconBtn
            icon={(props) => <CaretDown {...props} weight="fill" />}
            iconSize={16}
            iconColor="text-dg"
            size="w-5 h-5"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          {isDropdownOpen && (
            <Dropdown
              onClose={() => setIsDropdownOpen(false)}
              width="w-30"
              className="absolute top-6 left-full -ml-4"
            >
              {recentDates.map((item, index) => (
                <DropdownItem
                  key={index}
                  text={item.formatted}
                  mobile={true}
                  onClick={() => {
                    setSelectedDate(item.date);
                    setIsDropdownOpen(false);
                  }}
                />
              ))}
            </Dropdown>
          )}
        </div>
      </div>

      {/* 작업목록 */}
      <div className="w-full h-[53px] flex items-center justify-between px-5 py-3 bg-bg rounded-[8px] border border-lg">
        <span className="m-Heading-3-semibold text-dg">작업목록</span>
        <div className="flex gap-0.5 items-center">
          <span className="m-Heading-1b text-primary">9</span>
          <span className="m-Heading-3-semibold text-dg">건</span>
        </div>
      </div>
    </div>
  );
};

export default WorkList;
