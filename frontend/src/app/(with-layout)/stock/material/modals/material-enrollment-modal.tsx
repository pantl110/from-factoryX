import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { MaterialNameDropdown } from '@/ui/dropdown/material-name-dropdown';
import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react/dist/ssr';
import ManualAddMaterial from './manual-add-material';
import { ClientModel, MaterialItemModel } from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';
import { useMaterialReloadStore } from '@/store/material-reload-store';
import { useGetMaterial, useCreateMaterialHistory } from '@/hooks';
import { useForm } from 'react-hook-form';

interface MaterialEnrollmentProps {
  onClose?: () => void;
  clientInfo: ClientModel;
  showToast: () => void;
}

interface MaterialFormModel {
  quantity: { [key: string]: number | null };
  price: { [key: string]: number | null };
}

const MaterialEnrollmentModal = ({
  onClose,
  clientInfo, // 추가: 상위에서 전달받는 거래처 정보
  showToast,
}: MaterialEnrollmentProps) => {
  // 원자재 검색 드랍다운 관련
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredMaterials, setFilteredMaterials] = useState<
    MaterialItemModel[]
  >([]);

  const factoryId = useFactoryStore((state) => state.factoryId);
  const [selectedMaterials, setSelectedMaterials] = useState<
    MaterialItemModel[]
  >([]);
  const [isManualAddMode, setIsManualAddMode] = useState(false);
  const { createMaterialHistory, isLoading: isCreating } =
    useCreateMaterialHistory();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const { setShouldReload } = useMaterialReloadStore();

  const { getMaterialList } = useGetMaterial();

  // React Hook Form
  const {
    register,
    setValue,
    formState: { isValid },
  } = useForm<MaterialFormModel>({
    mode: 'onChange',
  });

  // 수동으로 유효성 검사 수행
  const isFormValid = () => {
    return selectedMaterials.every(
      (mat) =>
        mat.quantity !== null &&
        mat.quantity > 0 &&
        mat.price !== null &&
        mat.price > 0
    );
  };

  // 검색어가 변경될 때 서버에서 검색
  const [previousSearchKeyword, setPreviousSearchKeyword] = useState('');

  const [allMaterials, setAllMaterials] = useState<string[]>([]);

  useEffect(() => {
    // 직접 추가 모드 진입 시 전체 원자재 코드 목록을 받아옴
    if (isManualAddMode && factoryId) {
      getMaterialList({}).then((result) => {
        if (result.success && result.data) {
          setAllMaterials((result.data.data || []).map((mat) => mat.code));
        }
      });
    }
  }, [isManualAddMode, factoryId, getMaterialList]);

  useEffect(() => {
    const searchMaterials = async () => {
      // 검색어가 없으면 드롭다운 비우기
      if (!input.trim()) {
        setFilteredMaterials([]);
        setPreviousSearchKeyword('');
        return;
      }

      // 이전 검색어와 같으면 요청하지 않음
      if (input.trim() === previousSearchKeyword) {
        return;
      }

      const result = await getMaterialList({ q: input.trim() });
      if (result.success && result.data) {
        setFilteredMaterials(
          (result.data.data || []).map((mat) => ({
            name: mat.name,
            code: mat.code,
            spec: mat.spec,
            unit: mat.unit,
            quantity: 0,
            price: 0,
          }))
        );
        setPreviousSearchKeyword(input.trim());
      }
    };

    const timeoutId = setTimeout(searchMaterials, 300);
    return () => clearTimeout(timeoutId);
  }, [input, getMaterialList, previousSearchKeyword]);

  const handleSelectMaterial = (item: MaterialItemModel) => {
    setInput('');
    setSelectedMaterials((prev) => {
      if (!prev.some((mat) => mat.code === item.code)) {
        // React Hook Form에 기본값 설정
        setValue(`quantity.${item.code}`, null);
        setValue(`price.${item.code}`, null);
        return [...prev, item];
      }
      return prev;
    });
    setIsOpen(false);
  };

  const handleRemoveMaterial = (code: string) => {
    setSelectedMaterials((prev) => prev.filter((mat) => mat.code !== code));
  };

  const handleQuantityChange = (code: string, quantity: number) => {
    setSelectedMaterials((prev) =>
      prev.map((mat) => (mat.code === code ? { ...mat, quantity } : mat))
    );
  };

  const handlePriceChange = (code: string, price: number) => {
    setSelectedMaterials((prev) =>
      prev.map((mat) => (mat.code === code ? { ...mat, price } : mat))
    );
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
        code: mat.code,
        spec: mat.spec,
        unit: mat.unit,
        quantity: mat.quantity,
        price: mat.price,
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
      {!isSuccessModalOpen && (
        <>
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
                setNewMaterials={(fn) => {
                  const newMaterials = fn([]);
                  setSelectedMaterials((prev) => {
                    const updatedMaterials = [...prev, ...newMaterials];

                    // React Hook Form에 새로 추가된 material의 수량과 단가 설정
                    newMaterials.forEach((material) => {
                      if (
                        material.quantity !== null &&
                        material.quantity !== undefined
                      ) {
                        setValue(
                          `quantity.${material.code}`,
                          material.quantity
                        );
                      }
                      if (
                        material.price !== null &&
                        material.price !== undefined
                      ) {
                        setValue(`price.${material.code}`, material.price);
                      }
                    });

                    return updatedMaterials;
                  });
                }}
                existingMaterials={allMaterials}
                showToast={showToast}
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
                      key={mat.code}
                      className="flex items-center h-14 border-b border-lg Me_Body-1 group"
                    >
                      <p
                        className="flex-1 px-3 text-dg truncate"
                        title={mat.name}
                      >
                        {mat.name ?? '-'}
                      </p>
                      <p
                        className="w-[80px] px-3 text-dg truncate"
                        title={mat.unit}
                      >
                        {mat.unit ?? '-'}
                      </p>
                      <div
                        className="flex-1 px-3 min-w-0 truncate"
                        title={`${mat.quantity}`}
                      >
                        <input
                          type="text"
                          className="text-dg focus:outline-none w-full min-w-0"
                          {...register(`quantity.${mat.code}`, {
                            required: true,
                            validate: (value) => value !== null && value > 0,
                          })}
                          onChange={(e) => {
                            const onlyNums = e.target.value.replace(
                              /[^0-9]/g,
                              ''
                            );
                            const quantity = onlyNums ? parseInt(onlyNums) : 0;
                            handleQuantityChange(mat.code, quantity);
                            setValue(
                              `quantity.${mat.code}`,
                              quantity === 0 ? null : quantity
                            );

                            // 실시간 콤마 포맷팅
                            if (onlyNums) {
                              e.target.value =
                                parseInt(onlyNums).toLocaleString();
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            if (value) {
                              e.target.value = parseInt(value).toLocaleString();
                            }
                          }}
                          placeholder="(필수)"
                        />
                      </div>
                      <div
                        className="w-[100px] px-3 min-w-0 truncate"
                        title={`${mat.price}`}
                      >
                        <input
                          type="text"
                          className="text-dg focus:outline-none w-full min-w-0"
                          {...register(`price.${mat.code}`, {
                            required: true,
                            validate: (value) => value !== null && value > 0,
                          })}
                          onChange={(e) => {
                            const onlyNums = e.target.value.replace(
                              /[^0-9]/g,
                              ''
                            );
                            const price = onlyNums ? parseInt(onlyNums) : 0;
                            handlePriceChange(mat.code, price);
                            setValue(
                              `price.${mat.code}`,
                              price === 0 ? null : price
                            );

                            // 실시간 콤마 포맷팅
                            if (onlyNums) {
                              e.target.value =
                                parseInt(onlyNums).toLocaleString();
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            if (value) {
                              e.target.value = parseInt(value).toLocaleString();
                            }
                          }}
                          placeholder="(필수)"
                        />
                      </div>
                      <p
                        className="flex-1 px-3 text-dg truncate min-w-0"
                        title={`${mat.quantity} * ${mat.price}`}
                      >
                        {(() => {
                          const material = selectedMaterials.find(
                            (m) => m.code === mat.code
                          );
                          if (
                            material &&
                            material.quantity &&
                            material.price &&
                            material.quantity > 0 &&
                            material.price > 0
                          ) {
                            return (
                              material.quantity * material.price
                            ).toLocaleString();
                          }
                          return '-';
                        })()}
                      </p>
                      {mat.code !== null && mat.code !== undefined && (
                        <div
                          className="w-[40px] flex items-center justify-center h-full flex-shrink-0"
                          onClick={() => handleRemoveMaterial(mat.code)}
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
        </>
      )}

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
              : selectedMaterials.length === 0 || isCreating || !isFormValid()
          }
          onClick={isSuccessModalOpen ? handleSuccessClose : handleRegister}
        />
      </div>
    </Modal>
  );
};

export default MaterialEnrollmentModal;
