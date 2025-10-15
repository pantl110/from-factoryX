import MoChip from '@/ui/mo-chip';
import { Plus } from '@phosphor-icons/react';

const StockInfoItem = () => {
  return (
    <div className="flex flex-col gap-5 border-b border-bg pb-8">
      {/* 사진 */}
      <div className="px-7 flex gap-2.5 overflow-x-auto scrollbar-hide">
        <div className="w-20 h-20 rounded-[8px] bg-lg shrink-0"></div>
        <div className="w-20 h-20 rounded-[8px] bg-lg shrink-0"></div>
        <div className="w-20 h-20 rounded-[8px] bg-lg shrink-0"></div>
        <div className="w-20 h-20 rounded-[8px] bg-lg shrink-0"></div>
        <div className="w-20 h-20 rounded-[8px] bg-lg shrink-0"></div>
        <div className="w-20 h-20 rounded-[8px] bg-lg shrink-0"></div>
        <button className="w-20 h-20 rounded-[8px] bg-bg shrink-0 border border-lg flex flex-col items-center justify-center gap-1.5">
          <Plus size={16} className="text-sv" />
          <p className="m-Info-Me text-sv">사진 6/10</p>
        </button>
      </div>

      {/* 정보 */}
      <div className="px-7 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <MoChip text="운영자" variant="secondary" small={true} />
          <span className="Heading-5 text-sv">yoogj1998</span>
        </div>
        <p className="m-Body-2 text-bl">창고 A동 2층 선반 B-12 칸</p>
        <p className="m-Body-3 text-sv">
          내용이 들어가요. 내용이 들어가요. 내용이 들어가요. 내용이 들어가요.
          내용이 들어가요. 내용이 들어가요. 내용이 들어가요. 내용이 들어가요.
          내용이 들어가요. 내용이 들어
        </p>
        <p className="m-Body-4 text-gr">2025-10-03</p>
      </div>
    </div>
  );
};

export default StockInfoItem;
