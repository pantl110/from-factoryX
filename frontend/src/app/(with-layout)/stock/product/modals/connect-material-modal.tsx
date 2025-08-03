import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import { MaterialNameDropdown } from '@/ui/dropdown/material-name-dropdown';
import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react/dist/ssr';
import ManualAddMaterial from '../../material/modals/manual-add-material';
import { MaterialItemModel } from '@/types/data-model';
import { MaterialResponseModel } from '@/types/data-model';
import {
  useGetMaterial,
  useMaterialProduct,
  useAssignMaterialProduct,
} from '@/hooks';

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

interface ConnectMaterialModalProps {
  onClose: () => void;
  productId: number | null;
  onSuccess?: () => void | Promise<void>;
}

const ConnectMaterialModal = ({
  onClose,
  productId,
  onSuccess,
}: ConnectMaterialModalProps) => {
  const [input, setInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newMaterials, setNewMaterials] = useState<MaterialItemModel[]>([]); // 수동 추가한 새로운 원자재
  const [isManualAddMode, setIsManualAddMode] = useState(false);
  const [filteredMaterials, setFilteredMaterials] = useState<
    MaterialResponseModel[]
  >([]);
  const { getMaterialList } = useGetMaterial();
  const { createMaterialProduct, isLoading: isConnecting } =
    useMaterialProduct();
  const { assignMaterialProduct, isLoading: isAssigning } =
    useAssignMaterialProduct();

  const [selectedMaterials, setSelectedMaterials] = useState<
    MaterialItemModel[]
  >([]);

  // 검색어가 변경될 때 서버에서 검색
  useEffect(() => {
    const searchMaterials = async () => {
      if (input.trim()) {
        // 첫 페이지를 가져와서 전체 페이지 수 확인
        const firstPageResult = await getMaterialList({
          q: input,
          page: 1,
          page_size: 10,
        });

        if (firstPageResult.success && firstPageResult.data) {
          const { totalCnt } = firstPageResult.data;

          // 전체 개수를 알았으니 한 번에 모든 데이터 가져오기
          const allDataResult = await getMaterialList({
            q: input,
            page: 1,
            page_size: totalCnt,
          });

          if (allDataResult.success && allDataResult.data) {
            setFilteredMaterials(allDataResult.data.data);
          }
        }
      } else {
        setFilteredMaterials([]);
      }
    };

    const timeoutId = setTimeout(searchMaterials, 150); // 디바운스
    return () => clearTimeout(timeoutId);
  }, [input, getMaterialList]);

  // 원자재 선택 시
  const handleSelectMaterial = (item: MaterialItemModel) => {
    setInput('');
    setSelectedMaterials((prev) => {
      if (!prev.some((mat) => mat.code === item.code)) {
        return [...prev, item];
      }
      return prev;
    });
    setIsDropdownOpen(false);
  };

  const handleRemoveMaterial = (code: string) => {
    setSelectedMaterials((prev) => prev.filter((mat) => mat.code !== code));
  };

  const handleRemoveNewMaterial = (code: string) => {
    setNewMaterials((prev) => prev.filter((mat) => mat.code !== code));
  };

  // 선택한 원자재들을 제품과 연결
  const handleConnectMaterials = async () => {
    if (
      (selectedMaterials.length === 0 && newMaterials.length === 0) ||
      !productId
    )
      return;

    try {
      // 1. 새로운 원자재 생성 및 연결
      if (newMaterials.length > 0) {
        const factoryId = getStoredFactoryId();
        if (!factoryId) {
          alert('공장 정보가 없습니다.');
          return;
        }

        const assignPayload = {
          factory_id: factoryId, // 로컬스토리지에서 가져오기
          product_id: productId,
          materials: newMaterials.map((material) => ({
            name: material.name,
            code: material.code,
            spec: material.spec,
            quantity: material.quantity || 100, // ‼️ ‼️ ‼️ ‼️ ‼️ ‼️ ‼️ 기본 수량 1로 설정 (수정 필요...!!
          })),
        };

        const assignResult = await assignMaterialProduct(assignPayload);
        if (!assignResult.success) {
          alert('새 원자재 생성 및 연결 실패: ' + assignResult.error);
          return;
        }
      }

      // 2. 기존 원자재 연결
      if (selectedMaterials.length > 0) {
        const connectPayload = {
          type: 'product' as const,
          target_id: productId,
          connections: selectedMaterials.map((material) => {
            const originalMaterial = filteredMaterials.find(
              (mat) => mat.code === material.code
            );
            return {
              id: originalMaterial?.id || 0,
              quantity: 100,
            };
          }),
        };

        const connectResult = await createMaterialProduct(connectPayload);
        if (!connectResult.success) {
          alert('기존 원자재 연결 실패: ' + connectResult.error);
          return;
        }
      }

      onClose();
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      alert('원자재 연결 중 오류가 발생했습니다. ' + error);
    }
  };

  return (
    <Modal
      title="품목과 연결할 원자재를 선택하거나 새로 추가해 주세요."
      width="w-[600px]"
      onClose={onClose}
    >
      <div className="mt-4 flex gap-2.5 relative">
        <SearchInput
          placeholder="원자재를 검색하세요."
          width="flex-1"
          value={input}
          onChange={setInput}
          onFocus={() => setIsDropdownOpen(true)}
          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
        />
        <MiniBtn
          text="직접 추가"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="bg-bg"
          height="h-12"
          onClick={() => setIsManualAddMode(true)}
        />

        {isDropdownOpen && input.trim() && filteredMaterials.length > 0 && (
          <div className="absolute left-0 top-14 z-10 w-[451px] h-[256px] overflow-y-auto">
            <MaterialNameDropdown
              items={filteredMaterials.map((mat) => ({
                name: mat.name,
                code: mat.code,
                spec: mat.spec,
                unit: mat.unit,
                quantity: 0,
                price: 0,
              }))}
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
          setNewMaterials={setNewMaterials}
        />
      ) : (
        // 선택한 원자재 list
        (selectedMaterials.length > 0 || newMaterials.length > 0) && (
          <div className="mt-4 flex flex-col">
            {/* 기존 원자재 */}
            {selectedMaterials.map((mat) => (
              <div
                key={mat.code}
                className="flex justify-between items-center h-10"
              >
                <p className="Me_body-1 text-dg">{mat.name}</p>
                <div
                  className="cursor-pointer w-10 h-10 flex justify-center items-center"
                  onClick={() => handleRemoveMaterial(mat.code)}
                >
                  <X size={16} className="text-gr" />
                </div>
              </div>
            ))}
            {/* 새로운 원자재 */}
            {newMaterials.map((mat) => (
              <div
                key={mat.code}
                className="flex justify-between items-center h-10"
              >
                <p className="Me_body-1 text-dg">{mat.name}</p>
                <div
                  className="cursor-pointer w-10 h-10 flex justify-center items-center"
                  onClick={() => handleRemoveNewMaterial(mat.code)}
                >
                  <X size={16} className="text-gr" />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <div className="mt-4 flex gap-2.5 justify-end">
        <MiniBtn
          text="취소"
          textColor="text-sv"
          hoverColor="bg-bg"
          onClick={onClose}
        />
        <MiniBtn
          text="추가"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          disabled={
            (selectedMaterials.length === 0 && newMaterials.length === 0) ||
            isManualAddMode ||
            isConnecting ||
            isAssigning
          }
          onClick={handleConnectMaterials}
        />
      </div>
    </Modal>
  );
};

export default ConnectMaterialModal;
