import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { MaterialNameDropdown } from '@/ui/dropdown/material-name-dropdown';
import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react/dist/ssr';
import ManualAddMaterial from './manual-add-material';
import { ClientModel, MaterialResponseModel } from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';
import { useMaterialReloadStore } from '@/store/material-reload-store';
import { useGetMaterial, useCreateMaterialHistory } from '@/hooks';

interface MaterialFormModel {
  id: string;
  name: string;
  code: string;
  spec: string;
  unit: string;
  quantity: number | null;
  price: number | null;
}

interface MaterialEnrollmentProps {
  onClose?: () => void;
  clientInfo: ClientModel;
}

const MaterialEnrollmentModal = ({
  onClose,
  clientInfo, // 추가: 상위에서 전달받는 거래처 정보
}: MaterialEnrollmentProps) => {
  // 원자재 검색 드랍다운 관련
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredMaterials, setFilteredMaterials] = useState<
    MaterialResponseModel[]
  >([]);

  const factoryId = useFactoryStore((state) => state.factoryId);
  const [selectedMaterials, setSelectedMaterials] = useState<
    MaterialResponseModel[]
  >([]);
  const [_newMaterials, setNewMaterials] = useState<MaterialFormModel[]>([]);
  const [isManualAddMode, setIsManualAddMode] = useState(false);
  const { createMaterialHistory, isLoading: isCreating } =
    useCreateMaterialHistory();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const { setShouldReload } = useMaterialReloadStore();

  const { getMaterialList } = useGetMaterial();

  // 검색어가 변경될 때 서버에서 검색
  useEffect(() => {
    const searchMaterials = async () => {
      if (input.trim()) {
        const result = await getMaterialList({ q: input });
        if (result.success && result.data) {
          setFilteredMaterials(result.data.data);
        }
      } else {
        setFilteredMaterials([]);
      }
    };

    const timeoutId = setTimeout(searchMaterials, 150); // 디바운스
    return () => clearTimeout(timeoutId);
  }, [input, getMaterialList]);

  const handleSelectMaterial = (item: MaterialResponseModel) => {
    setInput('');
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

  const handleRegister = async () => {
    if (factoryId === null) {
      return;
    }

    const payload = {
      factory: factoryId,
      client_info: clientInfo,
      materials: selectedMaterials.map((mat) => ({
        name: mat.name,
        code: String(mat.code ?? ''),
        spec: mat.spec,
        unit: String(mat.unit ?? ''),
        quantity: Number(mat.current_stock ?? 0),
        price: 0, // MaterialResponseModel에는 price 필드가 없으므로 기본값 0
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
          {isOpen && filteredMaterials.length > 0 && (
            <div className="absolute left-0 top-12 z-10 w-full">
              <MaterialNameDropdown
                items={filteredMaterials}
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
            setNewMaterials={setNewMaterials}
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
                  <p className="flex-1 px-3 text-dg truncate" title={mat.name}>
                    {mat.name ?? '-'}
                  </p>
                  <p className="w-[80px] px-3 text-dg">{mat.unit ?? '-'}</p>
                  {/* <p className="flex-1 px-3 text-dg">
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
                  </p> */}
                  {mat.id !== null && mat.id !== undefined && (
                    <div
                      className="w-[40px] flex items-center justify-center h-full"
                      onClick={() => handleRemoveMaterial(mat.id)}
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
