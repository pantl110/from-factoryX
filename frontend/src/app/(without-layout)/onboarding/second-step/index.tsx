import InfoLabelValue from "@/ui/info-label-value";
import MiniBtn from "@/ui/mini-btn";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import MaterialInputItem from "./material-input-item";

interface SecondStepProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const SecondStep = ({ onNextStep, onPrevStep }: SecondStepProps) => {
  return (
    <div className="bg-wh z-1 w-[800px] py-10 px-8 flex flex-col gap-7 items-center rounded-lg">
      {/* 컨텐츠 영역 */}
      <div className="flex flex-col gap-8">
        {/* 타이틀 영역 */}
        <div className="flex flex-col gap-2 items-center">
          <h3 className="Heading-3 text-primary">
            해당 품목을 만들 때 필요한 원자재를 추가해 주세요.
          </h3>
          <div className="Me_Body-2 text-bl text-center">
            운영을 시작하려면 먼저 품목과 설비 정보를 등록해야 해요.
            <br />
            등록이 완료되면 생산부터 재고까지 한눈에 관리할 수 있어요!
          </div>
        </div>

        {/* 표 영역  */}
        <div>
          <div className="flex">
            <InfoLabelValue label="품목명" value="투명아크릴판" />
            <InfoLabelValue label="품목코드" value="12345" />
          </div>
          <div className="flex">
            <InfoLabelValue label="규격" value="100x300mm" />
            <InfoLabelValue label="단위" value="EA" />
          </div>
        </div>

        {/* input container */}
        <div className="flex flex-col gap-2">
          <MaterialInputItem />
          <MaterialInputItem />
          <button className="w-full h-12 min-h-8 flex gap-2 items-center justify-center bg-bg Re-Body-1 text-sv border border-[#E4E4E7] rounded shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-primary-8 hover:text-dg">
            추가하기
            <Plus size={24} />
          </button>
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

export default SecondStep;
