import MiniBtn from "@/ui/mini-btn";
import { BellSimple, User } from "@phosphor-icons/react";

interface TopBarContentProps {
  selectedTab: string | null;
  pageStatus: string | null;
  onProductionPlanSaveClick?: () => void;
}

const TopBarContent = ({
  selectedTab,
  pageStatus,
  onProductionPlanSaveClick,
}: TopBarContentProps) => {
  const isProductionPlanSaveActive =
    selectedTab === "생산 계획" && pageStatus === "생산 대기";

  if (selectedTab === "생산 계획") {
    return (
      <div className="flex">
        <MiniBtn
          text="저장하기"
          textColor="text-primary"
          bgColor="bg-primary-8"
          hoverColor="hover:bg-secondary-hover"
          onClick={onProductionPlanSaveClick}
          disabled={!isProductionPlanSaveActive}
        />
      </div>
    );
  }

  // default
  return (
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
};

export default TopBarContent;
