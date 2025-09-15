import MiniBtn from "@/ui/mini-btn";
import { ProjectStatusType } from "@/types/status-type";

interface MainTitleSecProps {
  onNewQuotation: () => void;
  selectedStatus: ProjectStatusType | "전체";
  onStatusChange: (status: ProjectStatusType | "전체") => void;
}

const MainTitleSec = ({
  onNewQuotation,
  selectedStatus,
  onStatusChange,
}: MainTitleSecProps) => {
  const statuses: (ProjectStatusType | "전체")[] = [
    "전체",
    "견적협의",
    "생산 대기",
    "생산 중",
    "완료",
    "납품",
  ];

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
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            className={`cursor-pointer ${selectedStatus === status ? "text-dg" : "text-gr"} Heading-3`}
            onClick={() => onStatusChange(status)}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainTitleSec;
