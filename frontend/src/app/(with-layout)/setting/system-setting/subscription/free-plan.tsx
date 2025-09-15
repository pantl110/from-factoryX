import Chip from '@/ui/chip';

interface FreePlanProps {
  endDate?: string;
}

const FreePlan = ({ endDate }: FreePlanProps) => {
  const getRemainingDays = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);

    // 시간을 00:00:00으로 설정하여 날짜만 비교
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const remainingDays = endDate ? getRemainingDays(endDate) : 0;

  return (
    <div className="flex flex-col gap-1 py-4 px-6 bg-primary-8 rounded-xl">
      <div className="flex gap-2 items-center justify-between">
        <h3 className="Heading-3 text-primary">무료 체험 이용 중</h3>
        <Chip
          text={`${remainingDays}일 후 종료`}
          textColor="text-primary"
          bgColor="bg-[#e3f0ff]"
        />
      </div>
      <p className="text-dg Re_Body-1 whitespace-pre-line">
        기본적인 기능을 모두 이용할 수 있어요. <br />
        사용자 관리, 문서 작성, 권한 설정 등 핵심 기능이 모두 포함돼요.
      </p>
    </div>
  );
};

export default FreePlan;
