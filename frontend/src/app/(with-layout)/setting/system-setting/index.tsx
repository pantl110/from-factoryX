import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import usePageStatusStore from '@/store/page-status-store';
import Chip from '@/ui/chip';
import General from './general';
import Permission from './permission';
import Subscription from './subscription';

const SystemSetting = () => {
  const { settingChip, setSettingChip } = usePageStatusStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL 파라미터에서 tab 값 확인
    const tab = searchParams.get('tab');

    if (tab === 'subscription') {
      setSettingChip('subscription');
    } else if (
      !settingChip ||
      (settingChip !== 'general' &&
        settingChip !== 'permission' &&
        settingChip !== 'subscription')
    ) {
      setSettingChip('general'); // 초기 칩을 일반으로 설정
    }
  }, [settingChip, setSettingChip, searchParams]);

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
          onClick={() => setSettingChip('general')}
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
          onClick={() => setSettingChip('permission')}
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
          onClick={() => setSettingChip('subscription')}
          height="h-9"
          padding="px-4"
        />
      </div>
      {renderContent()}
    </div>
  );
};

export default SystemSetting;
