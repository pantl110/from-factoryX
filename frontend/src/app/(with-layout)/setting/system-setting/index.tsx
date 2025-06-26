import { useEffect } from "react";
import usePageStatusStore from "@/store/page-status-store";
import Chip from "@/ui/chip";
import General from "./general";
import Permission from "./permission";
import Subscription from "./subscription";

const SystemSetting = () => {
  const { selectedChip, setSelectedChip } = usePageStatusStore();

  useEffect(() => {
    if (
      !selectedChip ||
      (selectedChip !== "general" &&
        selectedChip !== "permission" &&
        selectedChip !== "subscription")
    ) {
      setSelectedChip("general"); // 초기 칩을 일반으로 설정
    }
  }, [selectedChip, setSelectedChip]);

  const renderContent = () => {
    switch (selectedChip) {
      case "general":
        return <General />;
      case "permission":
        return <Permission />;
      case "subscription":
        return <Subscription />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex gap-1 px-10 pb-6">
        <Chip
          text="일반"
          textColor={selectedChip === "general" ? "text-bg" : "text-dg"}
          bgColor={selectedChip === "general" ? "bg-dg" : "bg-transparent"}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={() => setSelectedChip("general")}
        />
        <Chip
          text="권한 설정"
          textColor={selectedChip === "permission" ? "text-bg" : "text-dg"}
          bgColor={selectedChip === "permission" ? "bg-dg" : "bg-transparent"}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={() => setSelectedChip("permission")}
        />
        <Chip
          text="구독 관리"
          textColor={selectedChip === "subscription" ? "text-bg" : "text-dg"}
          bgColor={selectedChip === "subscription" ? "bg-dg" : "bg-transparent"}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={() => setSelectedChip("subscription")}
        />
      </div>
      {renderContent()}
    </div>
  );
};

export default SystemSetting;
