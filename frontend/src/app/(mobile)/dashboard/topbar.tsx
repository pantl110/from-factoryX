import FactoryXLogo from '@/ui/icons/factory-x-logo';
import IconBtn from '@/ui/icon-btn';
import { Bell } from '@phosphor-icons/react';

const TopBar = () => {
  return (
    <div className="w-full h-[60px] bg-white sticky top-0 z-30 pl-5 pr-6.5 flex items-center justify-between border-b border-lg">
      <FactoryXLogo />
      <IconBtn icon={Bell} iconSize={20} size="w-11 h-11" onClick={() => {}} />
    </div>
  );
};

export default TopBar;
