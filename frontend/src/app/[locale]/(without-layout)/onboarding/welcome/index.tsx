import Image from 'next/image';
import onboardingImage from '@/assets/onboarding.png';
import MiniBtn from '@/ui/mini-btn';
import useMemberStore from '@/store/member-store';
import useAuthStore from '@/store/auth-store';
import { useGetFactoryList, useCreateFactory, useGetMember } from '@/hooks';
import { useTranslations } from 'next-intl';

interface WelcomeProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const Welcome = ({ onNextStep, onPrevStep }: WelcomeProps) => {
  const t = useTranslations('onboarding.welcome');
  const tThirdStep = useTranslations('onboarding.thirdStep');
  const tCommon = useTranslations('common');
  const tFirstStep = useTranslations('onboarding.firstStep');
  const { createFactory, isLoading } = useCreateFactory();
  const { getFactoryList } = useGetFactoryList();
  const { userInfo, setUserInfo } = useAuthStore();
  const { getMember } = useGetMember();
  const setFactoryId = useMemberStore((state) => state.setFactoryId);
  const setRole = useMemberStore((state) => state.setRole);
  const setIsBarobillUser = useMemberStore((state) => state.setIsBarobillUser);

  const setFactoryAndMember = async (factoryId: number) => {
    setFactoryId(factoryId);
    let memberId = userInfo?.member_id;
    if (!memberId) {
      // 공장 생성 직후 me 정보를 갱신하여 member_id 확보
      try {
        const meRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (meRes.ok) {
          const meData = await meRes.json();
          setUserInfo(meData);
          memberId = meData?.member_id;
        }
      } catch {
        // Handle error silently
      }
    }

    if (memberId) {
      const res = await getMember({
        factory_id: factoryId,
        member_id: memberId,
      });
      if (res.success && res.data) {
        setRole(res.data.role);
        setIsBarobillUser(res.data.is_barobill_user);
      }
    }
  };

  const handleFactoryOwnerStart = async () => {
    try {
      // 먼저 기존 공장이 있는지 확인 // 이전으로 돌아왔을 때 공장 중복 생성 방지
      const factoryResult = await getFactoryList();

      if (
        factoryResult.success &&
        factoryResult.data &&
        factoryResult.data.length > 0
      ) {
        // 기존 공장이 있으면 첫 번째 공장을 사용
        const existingFactory = factoryResult.data[0];
        await setFactoryAndMember(existingFactory.id);
        onNextStep();
      } else {
        // 기존 공장이 없으면 새로 생성
        const result = await createFactory({
          name: '', // 기본 공장명 빈값
        });

        if (result.success && result.data) {
          // 생성된 공장 ID 저장 및 멤버 정보 세팅
          await setFactoryAndMember(result.data.id);
          // 다음 단계로 진행
          onNextStep();
        } else {
          // 공장 생성 실패 시 에러 처리
          alert(t('errors.factoryCreateFailed'));
        }
      }
    } catch {
      alert(t('errors.factoryCheckError'));
    }
  };

  return (
    <div className="bg-wh z-1 w-[600px] py-10 px-8 flex flex-col items-center rounded-lg">
      <h3 className="Heading-3 text-primary mb-1">{t('title')}</h3>
      <div className="Me_Body-2 text-bl text-center">
        {tThirdStep('description.part1')}
        {tThirdStep('description.part2') && (
          <>
            <br />
            {tThirdStep('description.part2')}
          </>
        )}
        <br />
        {tThirdStep('description.part3')}
        <br />
        <br />
        {tThirdStep('description.part4')}{' '}
        <span className="text-primary">
          {tThirdStep('description.highlight')}
        </span>{' '}
        {tThirdStep('description.part5')}
        <br />
        {tThirdStep('description.part6')}
      </div>
      <div className="p-7">
        <Image src={onboardingImage} alt="onboarding" />
      </div>
      <div className="w-full flex justify-end gap-2.5">
        <MiniBtn
          text={tFirstStep('buttons.previous')}
          variant="white"
          onClick={onPrevStep}
        />
        <MiniBtn
          text={tCommon('next')}
          variant="secondary"
          onClick={handleFactoryOwnerStart}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default Welcome;
