'use client';

import { useEffect, useState } from 'react';
import { OnboardingStepType } from './types';
// TODO: 온보딩 임시 스킵 - 나중에 원복 필요
// import Welcome from './welcome';
// import FirstStep from './first-step';
// import SecondStep from './second-step';
import ThirdStep from './third-step';
import { useRouter } from '@/i18n/navigation';
import ChoosingRole from './choosing-role';
import { useGetFactoryList } from '@/hooks';
import useAuthStore from '@/store/auth-store';
import Spinner from '@/ui/spinner';

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] =
    useState<OnboardingStepType>('choosing-role');
  const [isCheckingFactory, setIsCheckingFactory] = useState(true);

  const router = useRouter();
  const { getFactoryList } = useGetFactoryList();
  const { isAuthenticated } = useAuthStore();

  // 공장이 있으면 리다이렉트 체크
  useEffect(() => {
    const checkFactoryAndRedirect = async () => {
      try {
        const factoryResult = await getFactoryList();

        if (
          factoryResult.success &&
          factoryResult.data &&
          factoryResult.data.length > 0
        ) {
          // 공장이 있으면 리다이렉트
          if (isAuthenticated) {
            // 로그인되어 있으면 홈(대시보드)으로
            router.push('/dashboard');
          } else {
            // 로그인되어 있지 않으면 로그인 페이지로
            router.push('/login');
          }
        } else {
          // 공장이 없으면 온보딩 진행
          setIsCheckingFactory(false);
        }
      } catch {
        // 에러 발생 시 온보딩 진행
        setIsCheckingFactory(false);
      }
    };

    checkFactoryAndRedirect();
  }, [getFactoryList, isAuthenticated, router]);

  // Leave-onboarding cleanup: clear only when exiting this page
  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem('onboarding-step1-product');
        sessionStorage.removeItem('onboarding-step2-materials');
        sessionStorage.removeItem('onboarding-product-id');
      } catch {
        // ignore cleanup errors
        void 0;
      }
    };
  }, []);
  // TODO: 온보딩 welcome/first-step/second-step 임시 스킵 - 나중에 원복 필요
  const steps = [
    'choosing-role',
    // 'welcome',
    // 'first-step',
    // 'second-step',
    'third-step',
  ] as const;
  type StepType = (typeof steps)[number];

  const handleNextStep = () => {
    const currentIdx = steps.indexOf(currentStep as StepType);
    if (currentIdx < steps.length - 1) {
      setCurrentStep(steps[currentIdx + 1]);
    } else {
      router.push('/dashboard?from=onboarding'); // 마지막 단계
    }
  };
  const handlePrevStep = () => {
    const currentIdx = steps.indexOf(currentStep as StepType);
    if (currentIdx > 0) {
      setCurrentStep(steps[currentIdx - 1]);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'choosing-role':
        return <ChoosingRole onNextStep={handleNextStep} />;
      // TODO: 온보딩 임시 스킵 - 나중에 원복 필요
      // case 'welcome':
      //   return (
      //     <Welcome onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
      //   );
      // case 'first-step':
      //   return (
      //     <FirstStep onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
      //   );
      // case 'second-step':
      //   return (
      //     <SecondStep onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
      //   );
      case 'third-step':
        return (
          <ThirdStep onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
        );
      default:
        return <ChoosingRole onNextStep={handleNextStep} />;
    }
  };

  // 공장 체크 중이면 로딩 스피너 표시
  if (isCheckingFactory) {
    return (
      <div className="bg-wh w-full h-screen">
        <div className="w-full h-screen bg-bl/80 flex justify-center items-center">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-wh w-full h-screen">
      <div className="w-full h-screen bg-bl/80 flex justify-center items-center">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default OnboardingPage;
