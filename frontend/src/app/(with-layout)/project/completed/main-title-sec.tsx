import { CompletedProjectStatusType } from "@/types/status-type";

interface MainTitleSecProps {
  selectedStatus: "전체" | CompletedProjectStatusType;
  onStatusChange: (status: "전체" | CompletedProjectStatusType) => void;
}

const MainTitleSec = ({
  selectedStatus,
  onStatusChange,
}: MainTitleSecProps) => {
  return (
    <>
      <div className="flex flex-col gap-8 px-10 pt-10">
        <div className="Heading-1 text-dg">보관된 프로젝트</div>
        <div className="flex gap-4 items-center Heading-3">
          <button
            className={`cursor-pointer Heading-3 ${selectedStatus === "전체" ? "text-dg" : "text-gr"} `}
            onClick={() => onStatusChange("전체")}
          >
            전체
          </button>
          <button
            className={`cursor-pointer Heading-3 ${selectedStatus === "완료" ? "text-dg" : "text-gr"} `}
            onClick={() => onStatusChange("완료")}
          >
            완료
          </button>
          <button
            className={`cursor-pointer Heading-3 ${selectedStatus === "중단" ? "text-dg" : "text-gr"} `}
            onClick={() => onStatusChange("중단")}
          >
            중단
          </button>
        </div>
      </div>
    </>
  );
};

export default MainTitleSec;
