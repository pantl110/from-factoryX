import MiniBtn from "@/ui/mini-btn";

interface MainTitleSecProps {
  onNewQuotation: () => void;
}

const MainTitleSec = ({ onNewQuotation }: MainTitleSecProps) => {
  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <div className="Heading-1 text-dg">진행 중인 프로젝트</div>
        <MiniBtn
          bgColor="bg-primary"
          textColor="text-white"
          text="새 견적서 작성하기"
          onClick={onNewQuotation}
        />
      </div>
      <div className="flex gap-4 items-center Heading-3">
        <h3 className="text-dg">전체</h3>
        <h3 className="text-gr">견적 협의</h3>
        <h3 className="text-gr">생산 대기</h3>
        <h3 className="text-gr">생산 중</h3>
        <h3 className="text-gr">생산 완료</h3>
        <h3 className="text-gr">납품</h3>
      </div>
    </div>
  );
};

export default MainTitleSec;
