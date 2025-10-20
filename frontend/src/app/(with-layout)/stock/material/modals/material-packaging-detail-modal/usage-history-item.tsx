import IconBtn from '@/ui/icon-btn';
import { ArrowLineUpRight } from '@phosphor-icons/react';

export const UsageHistoryItem = () => {
  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-default group">
      <p className="flex-1 px-3 text-dg">2025-09-15</p>
      <p className="flex-1 px-3 text-dg">PRD-20250915-01</p>
      <div
        className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0"
        title="투명 아크릴판 1"
      >
        <p className="text-dg truncate">투명 아크릴판 1</p>
        <IconBtn
          icon={ArrowLineUpRight}
          size="w-9 h-9"
          iconSize={16}
          onClick={() => {}} // TODO: 품목 클릭 핸들러 추가
          groupHover={true}
        />
      </div>
      <p className="flex-1 px-3 text-red truncate" title="-50EA">
        -50EA
      </p>
    </div>
  );
};
