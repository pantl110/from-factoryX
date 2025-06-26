import { useEffect, useState } from "react";
import usePageStatusStore from "@/store/page-status-store";
import { SettingChipType } from "@/components/top-bar/types";
import Chip from "@/ui/chip";
import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import Facility from "./facility";
import Client from "./client";
import DeleteModal from "./facility/delete-modal";

const MasterData = () => {
  const { settingChip, setSettingChip } = usePageStatusStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (
      !settingChip ||
      (settingChip !== "equipment" && settingChip !== "client")
    ) {
      setSettingChip("equipment" as SettingChipType); // 설비관리 칩을 기본으로 설정
    }
  }, [settingChip, setSettingChip]);

  const handleDelete = () => {
    // 실제 삭제버튼 누를 시 동작
    setIsDeleteModalOpen(false);
  };

  const renderContent = () => {
    switch (settingChip) {
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
          textColor={settingChip === "equipment" ? "text-bg" : "text-dg"}
          bgColor={settingChip === "equipment" ? "bg-dg" : "bg-transparent"}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={() => setSettingChip("equipment" as SettingChipType)}
        />
        <Chip
          text="거래처 정보"
          textColor={settingChip === "client" ? "text-bg" : "text-dg"}
          bgColor={settingChip === "client" ? "bg-dg" : "bg-transparent"}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={() => setSettingChip("client" as SettingChipType)}
        />
      </div>
      <div className="flex items-center justify-between px-10 pb-4">
        <SearchInput />
        <div className="flex gap-1">
          <MiniBtn
            text="추가"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
          />
          <MiniBtn
            text="삭제"
            textColor="text-dg"
            borderColor="border-lg"
            onClick={() => setIsDeleteModalOpen(true)}
            hoverColor="hover:bg-bg"
          />
        </div>
      </div>
      {renderContent()}

      {/* 삭제 모달 */}
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default MasterData;
