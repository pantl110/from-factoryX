import PantlLogo from '@/ui/icons/pantl-logo';
import IconBtn from '@/ui/icon-btn';
import { Bell } from '@phosphor-icons/react';
import { useRouter } from '@/i18n/navigation';

const TopBar = () => {
  const router = useRouter();

  return (
    <div className="w-full h-[60px] bg-wh sticky top-0 z-30 pl-5 pr-6.5 flex items-center justify-between border-b border-lg">
      <PantlLogo />
      <IconBtn
        icon={Bell}
        iconSize={20}
        size="w-11 h-11"
        onClick={() => router.push('/alarm?tab=all')}
      />
    </div>
  );
};

export default TopBar;
