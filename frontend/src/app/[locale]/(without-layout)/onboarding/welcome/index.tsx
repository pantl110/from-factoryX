import Image from 'next/image';
import onboardingImage from '@/assets/onboarding.png';
import MiniBtn from '@/ui/mini-btn';
import {
  useGetFactoryList,
  useCreateFactory,
  useSetFactoryMember,
} from '@/hooks';
import { useTranslations } from 'next-intl';

interface WelcomeProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const Welcome = ({ onNextStep, onPrevStep }: WelcomeProps) => {
  const t = useTranslations('onboarding.welcome');
  const tCommon = useTranslations('common');
  const tFirstStep = useTranslations('onboarding.firstStep');
  const { createFactory, isLoading } = useCreateFactory();
  const { getFactoryList } = useGetFactoryList();
  const { setFactoryAndMember } = useSetFactoryMember();

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
        {t.rich('description', {
          b: (chunks) => <span className="font-bold">{chunks}</span>,
          br: () => <br />,
        })}
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
