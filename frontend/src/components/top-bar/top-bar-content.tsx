import MiniBtn from "@/ui/mini-btn";
import { BellSimple, User } from "@phosphor-icons/react";

const defaultContent = (
  <div className="flex">
    <div className="flex items-center justify-center w-11 h-11">
      <BellSimple size={20} className="text-dg" />
    </div>
    <div className="flex items-center justify-center w-11 h-11">
      <div className="flex items-center justify-center bg-blue-200 rounded-full w-8 h-8 border-2 border-blue-600">
        <User size={20} className="text-blue-600" />
      </div>
    </div>
  </div>
);

const productionWaitContent = (
  <div className="flex">
    <MiniBtn
      text="저장하기"
      textColor="text-primary"
      bgColor="bg-primary-8"
      hoverColor="hover:bg-bg"
    />
  </div>
);

const projectCompletedContent = (
  <div className="flex">
    <MiniBtn
      text="작업 재개"
      textColor="text-dg"
      borderColor="border-lg"
      hoverColor="hover:bg-bg"
    />
  </div>
);

export const topBarContentMap: Record<string, React.ReactNode> = {
  "생산 대기": productionWaitContent,
  "프로젝트 완료": projectCompletedContent,
  default: defaultContent,
};
