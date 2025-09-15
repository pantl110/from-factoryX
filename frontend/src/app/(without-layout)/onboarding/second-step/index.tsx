import Input from "@/ui/input";
import Progress from "../progress";
import MiniBtn from "@/ui/mini-btn";
import Item from "../item";

interface SecondStepProps {
  onNextStep: () => void;
}

const SecondStep = ({ onNextStep }: SecondStepProps) => {
  return (
    <div className="bg-wh z-1 w-[791px] h-[718px] pt-10 px-8 pb-6 flex flex-col items-center rounded-lg justify-between">
      <div className="flex flex-col gap-6">
        <Progress currentStep="second" />
        <div className="flex flex-col gap-3 items-center">
          <h3 className="Heading-3 text-primary">
            해당 품목을 만들 때 필요한 원자재를 추가해 주세요.
          </h3>
          <div
            className="w-[538px] flex flex-col gap-3 p-5 border-lg rounded-xl shadow"
            // style={{ boxShadow: "4px 4px 12px -8px #000000" }}
          >
            <div className="flex gap-3">
              <div className="flex-2">
                <Input
                  label="품목명"
                  type="text"
                  placeholder=""
                  required={true}
                />
              </div>
              <div className="flex-2">
                <Input
                  label="규격"
                  type="text"
                  placeholder=""
                  required={true}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="단위"
                  type="text"
                  placeholder=""
                  required={true}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <MiniBtn
                text="취소하기"
                textColor="text-sv"
                bgColor="bg-wh"
                hoverColor="bg-bg"
              />
              <MiniBtn
                text="추가하기"
                textColor="text-bl"
                bgColor="bg-wh"
                borderColor="border-lg"
                hoverColor="bg-bg"
              />
            </div>
          </div>

          <div className="w-[538px] h-[265px] bg-bg rounded-xl pt-2 pr-1 pl-3 overflow-y-auto">
            <Item material="나무" />
            <Item material="나무" />
            <Item material="나무" />
            <Item material="나무" />
            <Item material="나무" />
            <Item material="나무" />
            <Item material="나무" />
            <Item material="나무" />
            <Item material="나무" />
            <Item material="나무" />
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

export default SecondStep;
