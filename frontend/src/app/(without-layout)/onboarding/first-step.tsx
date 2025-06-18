interface FirstStepProps {
  onNextStep: () => void;
}

const FirstStep = ({ onNextStep }: FirstStepProps) => {
  return (
    <div className="bg-wh z-1 w-[791px] h-[718px] pt-10 px-8 pb-6 flex flex-col items-center rounded-lg">
      FirstStep
      <button onClick={onNextStep}>다음</button>
    </div>
  );
};

export default FirstStep;
