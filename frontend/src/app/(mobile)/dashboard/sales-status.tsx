import MoBtn from '@/ui/mo-btn';
import { CaretRight } from '@phosphor-icons/react';

const SalesStatus = () => {
  return (
    <div className="w-full flex flex-col gap-3 px-4 pt-4 pb-3 rounded-[8px] border border-lg">
      <div className="flex flex-col gap-1.5">
        <p className="m-Body-4 text-sv">정산 현황</p>
        <p className="m-Body">오늘 총 2건이 있어요</p>
      </div>

      {/* 매출 매입 */}
      <div className="w-full flex gap-2.5">
        <div className="flex-1 bg-bg rounded-[8px] h-10 flex items-center justify-between px-3 py-2">
          <p className="m-Body-4 text-sv">매출</p>
          <p className="m-Heading-3b">0</p>
        </div>
        <div className="flex-1 bg-bg rounded-[8px] h-10 flex items-center justify-between px-3 py-2">
          <p className="m-Body-4 text-sv">매입</p>
          <p className="m-Heading-3b">0</p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-center">
        <MoBtn
          text="자세히 보기"
          variant="ghost"
          icon={<CaretRight />}
          onClick={() => {}}
        />
      </div>
    </div>
  );
};

export default SalesStatus;
