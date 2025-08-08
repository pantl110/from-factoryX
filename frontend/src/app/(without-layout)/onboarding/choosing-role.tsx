import MiniBtn from '@/ui/mini-btn';

interface ChoosingRoleProps {
  onNextStep: () => void;
}

const ChoosingRole = ({ onNextStep }: ChoosingRoleProps) => {
  return (
    <div className="bg-wh z-1 w-[586px] pt-14 px-8 pb-6 flex flex-col items-center rounded-lg">
      <h3 className="Heading-3 text-primary mb-2">
        팩토리엑스에 오신 걸 환영합니다!
      </h3>
      <p className="Me_Body-2 text-center">
        운영을 시작하려면, 먼저 품목과 설비를 등록해야 해요. <br />
        등록이 완료되면, 생산부터 재고까지 한눈에 관리할 수 있어요!
      </p>

      <div className="w-full flex justify-end">
        <MiniBtn
          text="다음 단계"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={onNextStep}
        />
      </div>
    </div>
  );
};

export default ChoosingRole;
