import MiniBtn from "@/ui/mini-btn";
import Progress from "../progress";
import SearchInput from "@/ui/search-input";

interface FirstStepProps {
  onNextStep: () => void;
}

const FirstStep = ({ onNextStep }: FirstStepProps) => {
  return (
    <div className="bg-wh z-1 w-[791px] h-[718px] pt-10 px-8 pb-6 flex flex-col items-center rounded-lg justify-between">
      <div className="flex flex-col gap-6">
        <Progress currentStep="first" />
        <div className="flex flex-col gap-5 items-center">
          <h3 className="Heading-3 text-primary">
            품목과 연결할 원자재를 선택하거나 새로 추가해주세요.
          </h3>
          <div className="flex gap-2.5">
            <SearchInput />
            <MiniBtn
              text="직접 추가"
              textColor="text-bl"
              bgColor="bg-wh"
              borderColor="border-lg"
              hoverColor="#F4F4F5"
            />
          </div>
        </div>
      </div>

      <div className="w-full flex justify-end">
        <MiniBtn
          text="다음 단계"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="#005DC7"
          onClick={onNextStep}
        />
      </div>
    </div>
  );
};

export default FirstStep;
