import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import SearchInput from "@/ui/search-input";
import { useDropdownFilter } from "@/hooks/use-dropdown-filter";
import { materialData, MaterialDataModel } from "@/mocks/material-data";
import { MaterialNameDropdown } from "@/ui/dropdown/material-name-dropdown";
import { useState } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import ManualAddMaterial from "../../material/modals/manual-add-material";

interface ConnectMaterialModalProps {
  onClose: () => void;
}

const ConnectMaterialModal = ({ onClose }: ConnectMaterialModalProps) => {
  const { input, setInput, isOpen, setIsOpen, filtered, handleSelect } =
    useDropdownFilter(materialData, (item) => item.materialName);

  const [selectedMaterials, setSelectedMaterials] = useState<
    MaterialDataModel[]
  >([]);
  const [isManualAddMode, setIsManualAddMode] = useState(false);

  // 원자재 선택 시
  const handleSelectMaterial = (item: MaterialDataModel) => {
    handleSelect(item);
    setInput("");
    setSelectedMaterials((prev) => {
      if (!prev.some((mat) => mat.id === item.id)) {
        return [...prev, item];
      }
      return prev;
    });
    setIsOpen(false);
  };

  const handleRemoveMaterial = (id: number) => {
    setSelectedMaterials((prev) => prev.filter((mat) => mat.id !== id));
  };

  return (
    <Modal
      title="품목과 연결할 원자재를 선택하거나 새로 추가해 주세요."
      width="w-[600px]"
      onClose={onClose}
    >
      <div className="mt-4 flex gap-2.5 relative">
        <SearchInput
          placeholder="원자재 검색"
          width="flex-1"
          value={input}
          onChange={setInput}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        />
        <MiniBtn
          text="직접 추가"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="bg-bg"
          height="h-12"
          onClick={() => setIsManualAddMode(true)}
        />

        {isOpen && filtered.length > 0 && (
          <div className="absolute left-0 top-12 z-10 w-[437px]">
            <MaterialNameDropdown
              items={filtered}
              onSelect={handleSelectMaterial}
              width="w-full"
            />
          </div>
        )}
      </div>

      {/* 직접 추가 모드 */}
      {isManualAddMode ? (
        <ManualAddMaterial
          setIsManualAddMode={setIsManualAddMode}
          setSelectedMaterials={setSelectedMaterials}
        />
      ) : (
        // 선택한 원자재 list
        selectedMaterials.length > 0 && (
          <div className="mt-4 flex flex-col">
            {selectedMaterials.map((mat) => (
              <div
                key={mat.id}
                className="flex justify-between items-center h-10"
              >
                <p className="Me_body-1 text-dg">{mat.materialName}</p>
                {mat.id !== null && mat.id !== undefined && (
                  <div
                    className="cursor-pointer w-10 h-10 flex justify-center items-center"
                    onClick={() => handleRemoveMaterial(mat.id as number)}
                  >
                    <X size={16} className="text-gr" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      <div className="mt-4 flex gap-2.5 justify-end">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          hoverColor="bg-bg"
          onClick={onClose}
        />
        <MiniBtn
          text="추가하기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          disabled={selectedMaterials.length === 0 || isManualAddMode}
          onClick={onClose}
        />
      </div>
    </Modal>
  );
};

export default ConnectMaterialModal;
