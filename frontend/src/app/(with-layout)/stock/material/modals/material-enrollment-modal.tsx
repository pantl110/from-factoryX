import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { MaterialNameDropdown } from '@/ui/dropdown/material-name-dropdown';
import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react/dist/ssr';
import ManualAddMaterial from './manual-add-material';
import {
  MaterialItemModel,
  ClientModel,
  MaterialResponseModel,
} from '@/types/data-model';
import { useMaterialReloadStore } from '@/store/material-reload-store';
import { useGetMaterial, useCreateMaterialHistory } from '@/hooks';
import { useForm } from 'react-hook-form';
import useMemberStore from '@/store/member-store';

interface MaterialEnrollmentProps {
  onClose: () => void;
  clientInfo: ClientModel;
  clientId?: number | null;
  showToast: () => void;
}

interface MaterialFormModel {
  quantity: { [key: string]: number | null };
  price: { [key: string]: number | null };
}

const MaterialEnrollmentModal = ({
  onClose,
  clientInfo, // 추가: 상위에서 전달받는 거래처 정보
  clientId, // 추가: 상위에서 전달받는 거래처 ID
  showToast,
}: MaterialEnrollmentProps) => {
  // 원자재 검색 드랍다운 관련
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { getMaterialList } = useGetMaterial();
  const factoryId = useMemberStore((state) => state.factoryId);

  const [selectedMaterials, setSelectedMaterials] = useState<
    MaterialItemModel[]
  >([]);
  const [isManualAddMode, setIsManualAddMode] = useState(false);
  const { createMaterialHistory, isLoading: isCreating } =
    useCreateMaterialHistory();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const { setShouldReload } = useMaterialReloadStore();

  // React Hook Form
  const { register, setValue } = useForm<MaterialFormModel>({
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

  const [allMaterials, setAllMaterials] = useState<string[]>([]);

  useEffect(() => {
    // 직접 추가 모드 진입 시 전체 원자재 코드 목록을 받아옴
    if (isManualAddMode) {
      getMaterialList({}).then(
        (result: {
          success: boolean;
          data?: { data?: Array<{ code: string }> };
        }) => {
          if (result.success && result.data) {
            setAllMaterials(
              (result.data.data || []).map((mat: { code: string }) => mat.code)
            );
          }
        }
      );
    }
  }, [isManualAddMode, getMaterialList]);

  const handleSelectMaterial = (item: MaterialResponseModel) => {
    setInput('');
    setSelectedMaterials((prev) => {
      if (!prev.some((mat) => mat.code === item.code)) {
        // MaterialResponseModel을 MaterialItemModel로 변환
        const materialItem: MaterialItemModel = {
          name: item.name,
          code: item.code,
          spec: item.spec,
          unit: item.unit,
          quantity: null, // 사용자가 입력할 수량
          price: null, // 사용자가 입력할 단가
        };

        // React Hook Form에 기본값 설정
        setValue(`quantity.${item.code}`, null);
        setValue(`price.${item.code}`, null);
        return [...prev, materialItem];
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
    if (!factoryId) {
      alert('공장 정보가 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const payload = {
      factory: factoryId,
      client_id: clientId || null, // 최상위 레벨에 client_id 전달
      client_info: clientInfo, // client_info는 client_id 없이 전달
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

  const handleSubmitKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.nativeEvent as KeyboardEvent).isComposing) return;
    if (e.key !== 'Enter') return;

    // 수동추가 폼 내부에서의 Enter는 무시
    const target = e.target as HTMLElement;
    if (isManualAddMode) return;
    if (target.closest('form[data-scope="manual-add-material"]')) return;

    // 검색창에서의 Enter는 제출 방지
    if (target.closest('input[type="text"][placeholder*="검색"]')) {
      e.preventDefault();
      return;
    }

    if (selectedMaterials.length === 0 || isCreating || !isFormValid()) return;
    e.preventDefault();
    handleRegister();
  };

  const handleSuccessClose = () => {
    setShouldReload(true);
    if (onClose) onClose();
  };

  // Global Enter handler when success modal is open
  useEffect(() => {
    if (!isSuccessModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (e.key !== 'Enter') return;
      e.preventDefault();
      handleSuccessClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessModalOpen]);

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
      onClose={isSuccessModalOpen ? handleSuccessClose : onClose}
      width="w-[520px]"
    >
      {!isSuccessModalOpen && (
        <div onKeyDown={handleSubmitKeyDown}>
          <div className="flex justify-end h-12 gap-2.5 mt-4 items-center">
            <div className="flex-1 relative">
              <SearchInput
                placeholder="원자재 검색"
                width="w-full"
                value={input}
                onChange={(value) => {
                  setInput(value);
                  if (value.length > 0) {
                    setIsOpen(true);
                  } else {
                    setIsOpen(false);
                  }
                }}
                onFocus={() => {
                  if (input.length > 0) {
                    setIsOpen(true);
                  }
                }}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
              {isOpen && input && (
                <div className="absolute left-0 top-14 w-[369.5px] z-10">
                  <MaterialNameDropdown
                    searchTerm={input}
                    onSelect={handleSelectMaterial}
                    onClose={() => {
                      setIsOpen(false);
                      setInput('');
                    }}
                    width="w-full"
                  />
                </div>
              )}
            </div>
            <MiniBtn
              text="직접 추가하기"
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
                noPrice={false}
                setIsManualAddMode={setIsManualAddMode}
                setNewMaterials={(
                  fn: (prev: MaterialItemModel[]) => MaterialItemModel[]
                ) => {
                  const newMaterials = fn([]);
                  setSelectedMaterials((prev) => {
                    const updatedMaterials = [...prev, ...newMaterials];

                    // React Hook Form에 새로 추가된 material의 수량과 단가 설정
                    setTimeout(() => {
                      newMaterials.forEach((material: MaterialItemModel) => {
                        if (
                          material.quantity !== null &&
                          material.quantity !== undefined
                        ) {
                          setValue(
                            `quantity.${material.code}`,
                            material.quantity
                          );
                          // DOM에 직접 포맷된 값 설정
                          const quantityInput = document.querySelector(
                            `input[name="quantity.${material.code}"]`
                          ) as HTMLInputElement;
                          if (quantityInput) {
                            quantityInput.value =
                              material.quantity.toLocaleString();
                          }
                        }
                        if (
                          material.price !== null &&
                          material.price !== undefined
                        ) {
                          setValue(`price.${material.code}`, material.price);
                          // DOM에 직접 포맷된 값 설정
                          const priceInput = document.querySelector(
                            `input[name="price.${material.code}"]`
                          ) as HTMLInputElement;
                          if (priceInput) {
                            priceInput.value = material.price.toLocaleString();
                          }
                        }
                      });
                    }, 0);

                    return updatedMaterials;
                  });
                }}
                existingMaterials={allMaterials}
                selectedMaterials={selectedMaterials}
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
                            const onlyNumsAndDot = e.target.value.replace(
                              /[^0-9.]/g,
                              ''
                            );
                            // 소수점이 여러 개 입력되는 것을 방지
                            const parts = onlyNumsAndDot.split('.');
                            const cleanValue =
                              parts.length > 2
                                ? parts[0] + '.' + parts.slice(1).join('')
                                : onlyNumsAndDot;

                            const quantity = cleanValue
                              ? parseFloat(cleanValue)
                              : 0;
                            handleQuantityChange(mat.code, quantity);
                            setValue(
                              `quantity.${mat.code}`,
                              quantity === 0 ? null : quantity
                            );

                            // 실시간 콤마 포맷팅 (소수점 포함)
                            if (cleanValue) {
                              e.target.value = parseFloat(
                                cleanValue
                              ).toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 1,
                              });
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
                        title={`${mat?.quantity ? mat.quantity * (mat?.price ?? 0) : '-'}`}
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
        </div>
      )}

      <div className="flex h-10 gap-2.5 justify-end mt-4">
        {!isSuccessModalOpen && (
          <MiniBtn
            text="취소"
            onClick={onClose}
            variant="white"
            type="button"
          />
        )}
        <MiniBtn
          text={isSuccessModalOpen ? '확인' : '추가하기'}
          variant="primary"
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
