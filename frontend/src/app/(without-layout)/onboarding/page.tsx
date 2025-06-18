"use client";

import { useState } from "react";
import Welcome from "./welcome";
import FirstStep from "./first-step";
import { OnboardingStepType } from "./types";

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStepType>("welcome");

  const handleNextStep = () => {
    switch (currentStep) {
      case "welcome":
        setCurrentStep("first-step");
        break;
      case "first-step":
        setCurrentStep("second-step");
        break;
      case "second-step":
        setCurrentStep("third-step");
        break;
      case "third-step":
        // 마지막 단계
        break;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "welcome":
        return <Welcome onNextStep={handleNextStep} />;
      case "first-step":
        return <FirstStep onNextStep={handleNextStep} />;
      case "second-step":
        return <div>Second Step Component</div>; // 두 번째 단계 컴포넌트
      case "third-step":
        return <div>Third Step Component</div>; // 세 번째 단계 컴포넌트
      default:
        return <Welcome onNextStep={handleNextStep} />;
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
