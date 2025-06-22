import { useState } from "react";
import Chip from "@/ui/chip";
import General from "./general";
import Permission from "./permission";
import Subscription from "./subscription";

const SystemSetting = () => {
  const [selectedChip, setSelectedChip] = useState<
    "general" | "permission" | "subscription"
  >("general");

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
          text="권한설정"
          textColor={selectedChip === "permission" ? "text-bg" : "text-dg"}
          bgColor={selectedChip === "permission" ? "bg-dg" : "bg-transparent"}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={() => setSelectedChip("permission")}
        />
        <Chip
          text="구독관리"
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
