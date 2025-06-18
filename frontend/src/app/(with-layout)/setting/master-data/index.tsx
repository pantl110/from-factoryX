import { useState } from "react";
import Chip from "@/ui/chip";
import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import Facility from "./facility";
import Client from "./client";

const MasterData = () => {
  const [selectedChip, setSelectedChip] = useState<"equipment" | "client">(
    "equipment",
  );

  const renderContent = () => {
    switch (selectedChip) {
      case "equipment":
        return <Facility />;
      case "client":
        return <Client />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex gap-1 px-10 pb-5">
        <Chip
          text="설비 관리"
          textColor={selectedChip === "equipment" ? "text-bg" : "text-dg"}
          bgColor={selectedChip === "equipment" ? "bg-dg" : "bg-transparent"}
          radius="rounded-full"
          borderColor="border-lg"
          onClick={() => setSelectedChip("equipment")}
        />
        <Chip
          text="거래처 정보"
          textColor={selectedChip === "client" ? "text-bg" : "text-dg"}
          bgColor={selectedChip === "client" ? "bg-dg" : "bg-transparent"}
          radius="rounded-full"
          borderColor="border-lg"
          onClick={() => setSelectedChip("client")}
        />
      </div>
      <div className="flex items-center justify-between px-10 pb-4">
        <SearchInput />
        <div className="flex gap-1">
          <MiniBtn
            text="추가"
            textColor="text-dg"
            borderColor="border-[#eeeeee]"
          />
          <MiniBtn text="삭제" textColor="text-red" bgColor="bg-red-8" />
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default MasterData;
