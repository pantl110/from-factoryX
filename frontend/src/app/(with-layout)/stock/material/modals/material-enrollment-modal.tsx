import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useDropdownFilter } from '@/hooks/use-dropdown-filter';
import { materialData } from '@/mocks/material-data';
import { MaterialNameDropdown } from '@/ui/dropdown/material-name-dropdown';
import { useState } from 'react';
import { X } from '@phosphor-icons/react/dist/ssr';
import ManualAddMaterial from './manual-add-material';
import useCreateMaterialHistory from '@/hooks/material-history/use-create-material-history';
import { ClientModel } from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';
import { useMaterialReloadStore } from '@/store/material-reload-store';

interface MaterialEnrollmentProps {
  onClose?: () => void;
  clientInfo: ClientModel;
}

const MaterialEnrollmentModal = ({
  onClose,
  clientInfo, // 추가: 상위에서 전달받는 거래처 정보
}: MaterialEnrollmentProps) => {
  const { input, setInput, isOpen, setIsOpen, filtered, handleSelect } =
    useDropdownFilter(materialData, (item) => item.materialName);
  const factoryId = useFactoryStore((state) => state.factoryId);
  const [selectedMaterials, setSelectedMaterials] = useState<
    typeof materialData
  >([]);
  const [isManualAddMode, setIsManualAddMode] = useState(false);
  const { createMaterialHistory, isLoading: isCreating } =
    useCreateMaterialHistory();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const { setShouldReload } = useMaterialReloadStore();

  const handleSelectMaterial = (item: (typeof materialData)[number]) => {
    handleSelect(item);
    setInput('');
    setSelectedMaterials((prev) => {
      if (!prev.some((mat) => mat.id === item.id)) {
        return [...prev, item];
      }
      return prev;
    });
    setIsOpen(false);
  };
  const handleRemoveMaterial = (id: string) => {
    setSelectedMaterials((prev) => prev.filter((mat) => mat.id !== id));
  };

  const handleRegister = async () => {
    if (factoryId === null) {
      return;
    }

    const payload = {
      factory: factoryId,
      client_info: clientInfo,
      materials: selectedMaterials.map((mat) => ({
        name: mat.materialName,
        code: String(mat.code ?? ''),
        spec: mat.size,
        unit: String(mat.unit ?? ''),
        quantity: Number(mat.usageQuantity ?? 0),
        price: Number(mat.unitPrice ?? 0),
      })),
    };
    const result = await createMaterialHistory(payload);
    if (result.success) {
      setIsSuccessModalOpen(true);
    } else {
      alert(result.error || '원자재 이력 생성에 실패했습니다.');
    }
  };

  const handleSuccessClose = () => {
    setShouldReload(true);
    if (onClose) onClose();
  };

  return (
    <Modal
      title={
        isSuccessModalOpen
          ? '자재가 추가되었어요.'
          : '이 거래처에서 구매한 원자재를 등록해주세요.'
      }
      subtitle={
        isSuccessModalOpen
          ? '추가된 자재는 목록에서 바로 확인할 수 있어요.'
          : '입력한 거래처로부터 실제로 구매한 원자재 정보를 입력해 주세요.'
      }
      onClose={onClose}
      width="w-[600px]"
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

      <div className="mt-4 max-h-[calc(85vh-203px)] overflow-y-auto scrollbar-hide">
        {/* 직접 추가 area */}
        {isManualAddMode && (
          <ManualAddMaterial
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
                    {mat.materialName ?? '-'}
                  </p>
                  <p className="w-[80px] px-3 text-dg">{mat.unit ?? '-'}</p>
                  <p className="flex-1 px-3 text-dg">
                    {mat.usageQuantity ?? '-'}
                  </p>
                  <p className="w-[100px] px-3 text-dg">
                    {mat.unitPrice !== null && mat.unitPrice !== undefined
                      ? mat.unitPrice.toLocaleString()
                      : '-'}
                  </p>
                  <p className="flex-1 px-3 text-dg">
                    {mat.unitPrice !== null &&
                    mat.unitPrice !== undefined &&
                    mat.usageQuantity !== null &&
                    mat.usageQuantity !== undefined
                      ? (mat.unitPrice * mat.usageQuantity).toLocaleString()
                      : '-'}
                  </p>
                  {mat.id !== null && mat.id !== undefined && (
                    <div
                      className="w-[40px] flex items-center justify-center h-full"
                      onClick={() => handleRemoveMaterial(mat.id as string)}
                    >
                      <div className="flex items-center justify-center w-9 h-9 cursor-pointer hover:bg-bg rounded-[8px]">
                        <X size={16} className="text-gr" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex h-10 gap-2.5 justify-end mt-4">
        <MiniBtn
          text="취소"
          textColor="text-sv"
          onClick={onClose}
          hoverColor=""
        />
        <MiniBtn
          text={isSuccessModalOpen ? '확인' : '추가'}
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          disabled={
            isSuccessModalOpen
              ? false
              : selectedMaterials.length === 0 || isCreating
          }
          onClick={isSuccessModalOpen ? handleSuccessClose : handleRegister}
        />
      </div>
    </Modal>
  );
};

export default MaterialEnrollmentModal;
