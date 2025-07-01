import MiniBtn from "@/ui/mini-btn";

interface ThirdStepProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const ThirdStep = ({ onNextStep, onPrevStep }: ThirdStepProps) => {
  return (
    <div className="bg-wh z-1 w-[586px] py-10 px-8 flex flex-col gap-7 items-center rounded-lg">
      {/* 컨텐츠 영역 */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 items-center">
          <h3 className="Heading-3 text-primary">
            팩토리엑스에 오신 걸 환영합니다!
          </h3>
          <div className="Me_Body-2 text-bl text-center">
            이제 생산부터 재고까지 모든 과정을 한눈에 관리할 수 있어요.
            <br />
            지금 바로 공장 운영을 시작해보세요!
          </div>
        </div>
      </div>

      {/* 모달버튼 영역 */}
      <div className="w-full flex justify-end gap-2.5">
        <MiniBtn
          text="이전 단계"
          textColor="text-sv"
          bgColor="bg-wh"
          hoverColor="bg-bg"
          onClick={onPrevStep}
        />
        <MiniBtn
          text="시작하기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={onNextStep}
        />
      </div>
    </div>
  );
};

export default ThirdStep;
