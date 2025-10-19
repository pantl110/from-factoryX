import IconBtn from '@/ui/icon-btn';
import { ArrowLineUpRight } from '@phosphor-icons/react';

const SubstituteMaterialItem = () => {
  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1">
      <p className="flex-1 px-3 text-dg truncate cursor-default">자재명</p>
      <p className="flex-1 px-3 text-dg truncate cursor-default">1111</p>
      <p className="flex-1 px-3 text-dg truncate cursor-default">2030mm</p>
      <p className="flex-1 px-3 text-dg truncate cursor-default">100kg</p>
      <p className="flex-1 px-3 text-dg truncate cursor-default">1</p>
      <div className="flex-1 px-3 text-dg truncate cursor-default">
        <IconBtn icon={ArrowLineUpRight} iconSize={16} onClick={() => {}} />
      </div>
    </div>
  );
};

export default SubstituteMaterialItem;
