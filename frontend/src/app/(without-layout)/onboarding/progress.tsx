interface ProgressProps {
  currentStep: string;
}

const Progress = ({ currentStep }: ProgressProps) => {
  const isStepActive = (step: string) => {
    if (currentStep === 'first') {
      return step === 'first';
    } else if (currentStep === 'second') {
      return step === 'first' || step === 'second';
    } else if (currentStep === 'third') {
      return true;
    }
    return false;
  };

  return (
    <div className="flex gap-2.5">
      <div className="w-[183px] flex flex-col gap-2.5">
        <p
          className={`Me_Body-2 ${isStepActive('first') ? 'text-primary' : 'text-lg'}`}
        >
          1. 품목 추가하기
        </p>
        <div
          className={`w-full h-[8px] ${isStepActive('first') ? 'bg-primary' : 'bg-lg'}`}
        ></div>
      </div>
      <div className="w-[183px] flex flex-col gap-2.5">
        <p
          className={`Me_Body-2 ${isStepActive('second') ? 'text-primary' : 'text-lg'}`}
        >
          2. 원자재 연결하기
        </p>
        <div
          className={`w-full h-[8px] ${isStepActive('second') ? 'bg-primary' : 'bg-lg'}`}
        ></div>
      </div>
      <div className="w-[183px] flex flex-col gap-2.5">
        <p
          className={`Me_Body-2 ${isStepActive('third') ? 'text-primary' : 'text-lg'}`}
        >
          3. 생산 설비 추가하기
        </p>
        <div
          className={`w-full h-[8px] ${isStepActive('third') ? 'bg-primary' : 'bg-lg'}`}
        ></div>
      </div>
    </div>
  );
};

export default Progress;
