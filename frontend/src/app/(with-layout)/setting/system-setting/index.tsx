import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import usePageStatusStore from '@/store/page-status-store';
import Chip from '@/ui/chip';
import General from './general';
import Permission from './permission';
import Subscription from './subscription';

const SystemSetting = () => {
  const { settingChip, setSettingChip } = usePageStatusStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initRef = useRef(false);

  useEffect(() => {
    // URL의 chip 쿼리를 최초 진입 시 chip 초기값으로만 사용하고, 이후에는 chip이 단독으로 상태를 가짐
    if (initRef.current) return;
    const chip = searchParams.get('chip');
    if (
      chip === 'subscription' ||
      chip === 'permission' ||
      chip === 'general'
    ) {
      setSettingChip(chip as 'subscription' | 'permission' | 'general');
    } else {
      setSettingChip('general');
    }
    initRef.current = true;
  }, [searchParams, setSettingChip]);

  const handleChipChange = (
    chip: 'general' | 'permission' | 'subscription'
  ) => {
    // 상태와 URL을 함께 갱신하여 이펙트가 사용자의 선택을 덮어쓰지 않도록 함
    setSettingChip(chip);
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    sp.set('chip', chip);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const renderContent = () => {
    switch (settingChip) {
      case 'general':
        return <General />;
      case 'permission':
        return <Permission />;
      case 'subscription':
        return <Subscription />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex gap-1 px-10 pb-6">
        <Chip
          text="일반"
          textColor={settingChip === 'general' ? 'text-bg' : 'text-dg'}
          bgColor={settingChip === 'general' ? 'bg-dg' : 'bg-transparent'}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={() => handleChipChange('general')}
          height="h-9"
          padding="px-4"
        />
        <Chip
          text="권한 설정"
          textColor={settingChip === 'permission' ? 'text-bg' : 'text-dg'}
          bgColor={settingChip === 'permission' ? 'bg-dg' : 'bg-transparent'}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={() => handleChipChange('permission')}
          height="h-9"
          padding="px-4"
        />
        <Chip
          text="구독 관리"
          textColor={settingChip === 'subscription' ? 'text-bg' : 'text-dg'}
          bgColor={settingChip === 'subscription' ? 'bg-dg' : 'bg-transparent'}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={() => handleChipChange('subscription')}
          height="h-9"
          padding="px-4"
        />
      </div>
      {renderContent()}
    </div>
  );
};

export default SystemSetting;
