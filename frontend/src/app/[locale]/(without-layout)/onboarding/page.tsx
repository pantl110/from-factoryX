'use client';

import { useEffect, useState } from 'react';
import { OnboardingStepType } from './types';
import Welcome from './welcome';
import FirstStep from './first-step';
import SecondStep from './second-step';
import ThirdStep from './third-step';
import { useRouter } from 'next/navigation';
import ChoosingRole from './choosing-role';

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] =
    useState<OnboardingStepType>('choosing-role');

  const router = useRouter();

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
  const steps = [
    'choosing-role',
    'welcome',
    'first-step',
    'second-step',
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
      case 'welcome':
        return (
          <Welcome onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
        );
      case 'first-step':
        return (
          <FirstStep onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
        );
      case 'second-step':
        return (
          <SecondStep onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
        );
      case 'third-step':
        return (
          <ThirdStep onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
        );
      default:
        return <ChoosingRole onNextStep={handleNextStep} />;
    }
  };

  return (
    <div className="bg-wh w-full h-screen">
      <div className="w-full h-screen bg-bl/80 flex justify-center items-center">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default OnboardingPage;
