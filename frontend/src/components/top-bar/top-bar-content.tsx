import MiniBtn from "@/ui/mini-btn";
import { BellSimple, User } from "@phosphor-icons/react";
import usePageStatusStore from "@/store/page-status-store";

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

const ProductionWaitContent = () => {
  const selectedTab = usePageStatusStore((state) => state.selectedTab);
  const setProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.setProductionPlanSaveModalOpen,
  );

  if (selectedTab !== "생산 계획") return defaultContent;
  return (
    <div className="flex">
      <MiniBtn
        text="저장하기"
        textColor="text-primary"
        bgColor="bg-primary-8"
        hoverColor="hover:bg-secondary-hover"
        onClick={() => setProductionPlanSaveModalOpen(true)}
      />
    </div>
  );
};

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

export const topBarContentMap: Record<string, () => React.ReactNode> = {
  "생산 대기": () => <ProductionWaitContent />,
  "프로젝트 완료": () => projectCompletedContent,
  default: () => defaultContent,
};
