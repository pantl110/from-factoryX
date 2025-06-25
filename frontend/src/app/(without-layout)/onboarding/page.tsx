"use client";

import { useState } from "react";
import { OnboardingStepType } from "./types";
import Welcome from "./welcome";
import FirstStep from "./first-step";
import SecondStep from "./second-step";
import ThirdStep from "./third-step";
import { useRouter } from "next/navigation";

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStepType>("welcome");
  const router = useRouter();
  const steps = ["welcome", "first-step", "second-step", "third-step"] as const;
  type Step = (typeof steps)[number];

  const handleNextStep = () => {
    const currentIdx = steps.indexOf(currentStep as Step);
    if (currentIdx < steps.length - 1) {
      setCurrentStep(steps[currentIdx + 1]);
    } else {
      router.push("/dashboard"); // 마지막 단계
    }
  };
  const handlePrevStep = () => {
    const currentIdx = steps.indexOf(currentStep as Step);
    if (currentIdx > 0) {
      setCurrentStep(steps[currentIdx - 1]);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "welcome":
        return <Welcome onNextStep={handleNextStep} />;
      case "first-step":
        return (
          <FirstStep onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
        );
      case "second-step":
        return (
          <SecondStep onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
        );
      case "third-step":
        return (
          <ThirdStep onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
        );
      default:
        return (
          <Welcome onNextStep={handleNextStep} onPrevStep={handlePrevStep} />
        );
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
