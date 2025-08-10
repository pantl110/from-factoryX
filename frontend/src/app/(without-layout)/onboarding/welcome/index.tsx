import Image from 'next/image';
import onboardingImage from '@/assets/onboarding.png';
import MiniBtn from '@/ui/mini-btn';
import useCreateFactory from '@/hooks/factory/use-create-factory';
import useFactoryStore from '@/store/factory-store';
import { useGetFactoryList } from '@/hooks/factory/use-get-factory';

interface WelcomeProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const Welcome = ({ onNextStep, onPrevStep }: WelcomeProps) => {
  const { createFactory, isLoading } = useCreateFactory();
  const { getFactoryList } = useGetFactoryList();
  const setFactoryId = useFactoryStore((state) => state.setFactoryId);

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
        setFactoryId(existingFactory.id);
        onNextStep();
      } else {
        // 기존 공장이 없으면 새로 생성
        const result = await createFactory({
          name: '', // 기본 공장명 빈값
        });

        if (result.success && result.data) {
          // 생성된 공장 ID를 로컬 스토리지에 저장
          setFactoryId(result.data.id);
          // 다음 단계로 진행
          onNextStep();
        } else {
          // 공장 생성 실패 시 에러 처리
          alert('공장 생성에 실패했습니다. 다시 시도해주세요.');
        }
      }
    } catch {
      alert('공장 확인/생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="bg-wh z-1 w-[600px] py-10 px-8 flex flex-col items-center rounded-lg">
      <h3 className="Heading-3 text-primary mb-2">
        이제 공장을 본격적으로 운영해볼까요?
      </h3>
      <p className="Me_Body-2 text-center">
        운영을 시작하려면, 먼저 품목과 설비를 등록해야 해요. <br />
        등록이 완료되면, 생산부터 재고까지 한눈에 관리할 수 있어요!
      </p>
      <div className="p-7">
        <Image src={onboardingImage} alt="onboarding" />
      </div>
      <div className="w-full flex justify-end gap-2.5">
        <MiniBtn
          text="이전"
          textColor="text-sv"
          hoverColor="hover:bg-bg"
          onClick={onPrevStep}
          disabled={isLoading}
        />
        <MiniBtn
          text="다음"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={handleFactoryOwnerStart}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default Welcome;
