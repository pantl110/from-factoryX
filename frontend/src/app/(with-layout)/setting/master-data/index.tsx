import { useEffect, useState } from "react";
import usePageStatusStore from "@/store/page-status-store";
import { SettingChipType } from "@/components/top-bar/types";
import Chip from "@/ui/chip";
import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import Facility from "./facility";
import Client from "./client";
import { useDeleteMode } from "@/hooks/use-delete-mode";
import DeleteModal from "@/ui/modal/delete-modal";

const MasterData = () => {
  const { settingChip, setSettingChip } = usePageStatusStore();
  const equipmentDelete = useDeleteMode();
  const clientDelete = useDeleteMode();
  const [isEquipmentCreatePanelOpen, setIsEquipmentCreatePanelOpen] =
    useState(false);

  useEffect(() => {
    if (
      !settingChip ||
      (settingChip !== "equipment" && settingChip !== "client")
    ) {
      setSettingChip("equipment" as SettingChipType); // 설비관리 칩을 기본으로 설정
    }
  }, [settingChip, setSettingChip]);

  const isEquipmentTab = settingChip === "equipment";
  const deleteMode = isEquipmentTab ? equipmentDelete : clientDelete;

  const handleEquipmentChipClick = () =>
    setSettingChip("equipment" as SettingChipType);
  const handleClientChipClick = () =>
    setSettingChip("client" as SettingChipType);

  const handleDeleteBtnClick = () => deleteMode.toggleDeleteMode();
  const handleDeleteModalClose = () => deleteMode.closeDeleteModal();

  const handleAddBtnClick = () => {
    if (settingChip === "equipment") {
      setIsEquipmentCreatePanelOpen(true);
    } else {
      // setIsClientModalOpen(true);
    }
  };

  const renderContent = () => {
    switch (settingChip) {
      case "equipment":
        return (
          <Facility
            isDeleteMode={equipmentDelete.isDeleteMode}
            isCreatePanelOpen={isEquipmentCreatePanelOpen}
            setIsCreatePanelOpen={setIsEquipmentCreatePanelOpen}
          />
        );
      case "client":
        return <Client isDeleteMode={clientDelete.isDeleteMode} />;
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
          onClick={handleEquipmentChipClick}
        />
        <Chip
          text="거래처 정보"
          textColor={settingChip === "client" ? "text-bg" : "text-dg"}
          bgColor={settingChip === "client" ? "bg-dg" : "bg-transparent"}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={handleClientChipClick}
        />
      </div>
      <div className="flex items-center justify-between px-10 pb-4">
        <SearchInput />

        <div className="flex gap-2">
          {settingChip === "equipment" && (
            <MiniBtn
              text="추가"
              textColor="text-dg"
              borderColor="border-lg"
              hoverColor="hover:bg-lg"
              onClick={handleAddBtnClick}
            />
          )}

          <MiniBtn
            text="삭제"
            textColor={deleteMode.isDeleteMode ? "text-red" : "text-dg"}
            borderColor={deleteMode.isDeleteMode ? "border-none" : "border-lg"}
            bgColor={deleteMode.isDeleteMode ? "bg-red-8" : "bg-wh"}
            onClick={handleDeleteBtnClick}
            hoverColor={
              deleteMode.isDeleteMode ? "hover:bg-red-hover" : "hover:bg-bg"
            }
          />
        </div>
      </div>
      {renderContent()}
      {deleteMode.isDeleteModalOpen && (
        <DeleteModal onClose={handleDeleteModalClose} />
      )}
    </div>
  );
};

export default MasterData;
