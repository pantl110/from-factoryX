import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useGetFactoryList, useSetFactoryMember } from '@/hooks';

interface ChoosingRoleProps {
  onNextStep: () => void;
}

const ChoosingRole = ({ onNextStep }: ChoosingRoleProps) => {
  const router = useRouter();
  const t = useTranslations('onboarding.choosingRole');
  const { getFactoryList } = useGetFactoryList();
  const { setFactoryAndMember } = useSetFactoryMember();
  const [isConnecting, setIsConnecting] = useState(false);

  // 직원으로 시작: 초대 받은 공장에 연결하고 대시보드로 이동
  // (member store를 채우지 않으면 대시보드 auth guard가 로그인으로 튕김)
  const handleEmployeeStart = async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const factoryResult = await getFactoryList();

      if (
        !factoryResult.success ||
        !factoryResult.data ||
        factoryResult.data.length === 0
      ) {
        // 초대 받은 공장이 없는 경우
        alert(t('employee.noInvitedFactory'));
        return;
      }

      await setFactoryAndMember(factoryResult.data[0].id);
      router.push('/dashboard');
    } catch {
      alert(t('employee.connectError'));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-wh z-1 w-[600px] py-10 px-8 flex flex-col items-center rounded-lg">
      <div className="flex flex-col gap-1 items-center">
        <h3 className="Heading-3 text-primary">{t('title')}</h3>
        <p className="Me_Body-2 text-center">{t('subtitle')}</p>
      </div>

      <div className="w-full flex flex-col mt-7 gap-2">
        <button
          onClick={onNextStep}
          className="p-3 border border-lg rounded-[8px] flex flex-col gap-1 items-center justify-center hover:bg-green-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <h4 className="Heading-4 text-dg">{t('owner.title')}</h4>
          <p className="Re_Body-2 text-sv">{t('owner.description')}</p>
        </button>
        <button
          onClick={handleEmployeeStart}
          disabled={isConnecting}
          className="p-3 border border-lg rounded-[8px] flex flex-col gap-1 items-center justify-center hover:bg-green-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <h4 className="Heading-4 text-dg">{t('employee.title')}</h4>
          <p className="Re_Body-2 text-sv">{t('employee.description')}</p>
        </button>
      </div>
    </div>
  );
};

export default ChoosingRole;
