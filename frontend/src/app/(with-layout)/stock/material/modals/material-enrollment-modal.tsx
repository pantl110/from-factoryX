import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import { useDropdownFilter } from "@/hooks/use-dropdown-filter";
import { materialData } from "@/mocks/material-data";
import { MaterialNameDropdown } from "@/ui/dropdown/material-name-dropdown";
import { useState } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import ManualAdd from "./manual-add";

interface MaterialEnrollmentProps {
  onClose?: () => void;
  onRegister?: () => void;
}

const MaterialEnrollmentModal = ({
  onClose,
  onRegister,
}: MaterialEnrollmentProps) => {
  const { input, setInput, isOpen, setIsOpen, filtered, handleSelect } =
    useDropdownFilter(materialData, (item) => item.materialName);
  const [selectedMaterials, setSelectedMaterials] = useState<
    typeof materialData
  >([]);
  const [isManualAddMode, setIsManualAddMode] = useState(false);

  const handleSelectMaterial = (item: (typeof materialData)[number]) => {
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
      title="이 거래처에서 구매한 원자재를 등록해주세요."
      subtitle="입력한 거래처로부터 실제로 구매한 원자재 정보를 입력해 주세요."
      onClose={onClose}
      width="w-[586px]"
    >
      <div className="flex justify-end h-12 gap-2.5 mt-4 items-center">
        <div className="flex-1 relative">
          <SearchInput
            placeholder="원자재 검색"
            width="w-full"
            value={input}
            onChange={setInput}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          />
          {isOpen && filtered.length > 0 && (
            <div className="absolute left-0 top-12 z-10 w-full">
              <MaterialNameDropdown
                items={filtered}
                onSelect={handleSelectMaterial}
                width="w-full"
              />
            </div>
          )}
        </div>
        <MiniBtn
          text="직접 추가"
          textColor="text-dg"
          borderColor="border-lg"
          height="h-12"
          hoverColor="hover:bg-bg"
          onClick={() => setIsManualAddMode(true)}
        />
      </div>

      {/* 직접 추가 area */}
      {isManualAddMode && (
        <ManualAdd
          setIsManualAddMode={setIsManualAddMode}
          setSelectedMaterials={setSelectedMaterials}
        />
      )}

      {/* 선택된 원자재 리스트 */}
      {selectedMaterials.length > 0 && (
        <div className="mt-4 flex flex-col">
          <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
            <p className="flex-1 px-3 text-sv">자재명</p>
            <p className="w-[80px] px-3 text-sv">단위</p>
            <p className="flex-1 text-sv px-3">수량</p>
            <p className="w-[100px] text-sv px-3">단가</p>
            <p className="flex-1 text-sv px-3">금액</p>
            <div className="w-[40px]"></div>
          </div>
          <div className="flex flex-col">
            {selectedMaterials.map((mat) => (
              <div
                key={mat.id}
                className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 group"
              >
                <p
                  className="flex-1 px-3 text-dg truncate"
                  title={mat.materialName}
                >
                  {mat.materialName}
                </p>
                <p className="flex-1 px-3 text-dg">{mat.size}</p>
                <p className="w-[80px] px-3 text-dg">{mat.usageQuantity}</p>
                <p className="w-[100px] px-3 text-dg">
                  {mat.unitPrice?.toLocaleString()}
                </p>
                <p className="flex-1 px-3 text-dg">
                  {(mat.unitPrice ?? 0) * (mat.usageQuantity ?? 0)}
                </p>
                {mat.id !== null && (
                  <div
                    className="w-[40px] hover:bg-bg flex items-center justify-center h-full transition-colors duration-200 cursor-pointer"
                    onClick={() => handleRemoveMaterial(mat.id!)}
                  >
                    <X
                      size={16}
                      className="text-gr opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex h-10 gap-2.5 justify-end mt-4">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          onClick={onClose}
          hoverColor=""
        />
        <MiniBtn
          text="등록하기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          disabled={selectedMaterials.length === 0}
          onClick={onRegister}
        />
      </div>
    </Modal>
  );
};

export default MaterialEnrollmentModal;
