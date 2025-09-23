import { MaterialItemModel } from '@/types/data-model';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { handleQuantityInput } from '@/hooks/format-number';

interface ManualAddMaterialProps {
  noPrice?: boolean;
  setIsManualAddMode: (v: boolean) => void;
  setNewMaterials: (
    fn: (prev: MaterialItemModel[]) => MaterialItemModel[]
  ) => void;
  existingMaterials?: string[]; // 기존 원자재 코드만 저장
  selectedMaterials?: MaterialItemModel[]; // 현재 선택된 원자재들
  showToast?: (text: string, subtext: string) => void;
}

const ManualAddMaterial = ({
  noPrice = true,
  setIsManualAddMode,
  setNewMaterials,
  existingMaterials, // 기존 원자재 코드 목록 받기
  selectedMaterials = [], // 현재 선택된 원자재들
  showToast,
}: ManualAddMaterialProps) => {
  // 각 필드의 값을 직접 관리
  const [formValues, setFormValues] = useState({
    name: '',
    code: '',
    spec: '',
    unit: '',
    quantity: null as number | null,
    price: null as number | null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<MaterialItemModel>({
    defaultValues: {
      name: '',
      code: '',
      spec: '',
      unit: '',
      quantity: null,
      price: null,
    },
    mode: 'onChange',
  });

  // 수동으로 유효성 검사
  const isFormValid = () => {
    const { name, code, spec, unit, quantity, price } = formValues;
    const baseValidation =
      name.trim() &&
      code.trim() &&
      spec.trim() &&
      unit.trim() &&
      quantity !== null &&
      quantity > 0;

    if (noPrice) {
      return baseValidation;
    }

    return baseValidation && price !== null && price > 0;
  };

  const onSubmit = (data: MaterialItemModel) => {
    // 중복 검사 - 기존 원자재 + 현재 선택된 원자재들
    const isExistingDuplicate = existingMaterials?.includes(data.code);
    const isSelectedDuplicate = selectedMaterials.some(
      (material) => material.code === data.code
    );
    const isDuplicate = isExistingDuplicate || isSelectedDuplicate;

    if (isDuplicate) {
      // 토스트 메시지 표시 (토스트 시스템이 있다면)
      showToast?.(
        '이미 존재하는 자재코드에요.',
        '다른 자재코드로 수정해주세요.'
      );
      // 자재코드 필드에 에러 표시를 위해 form 에러 설정
      setError('code', {
        type: 'manual',
        message: '이미 존재하는 자재코드입니다.',
      });
      return;
    }

    setNewMaterials((prev) => [
      ...prev,
      {
        name: data.name,
        code: data.code,
        spec: data.spec,
        unit: data.unit,
        quantity: data.quantity,
        price: data.price,
      },
    ]);
    reset();
    window.setTimeout(() => setIsManualAddMode(false), 0);
  };

  return (
    <div className="mb-4 flex flex-col gap-3 border border-lg rounded-[12px] p-5 shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <form data-scope="manual-add-material" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2.5">
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="EX) 투명 필름지"
                label="자재명"
                required
                {...register('name', {
                  required: true,
                  validate: (v: unknown) => {
                    const str = String(v || '');
                    return !!str.trim();
                  },
                })}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <Input
                showError={!!errors.code}
                placeholder="EX) 123456"
                label="자재코드"
                required
                {...register('code', {
                  required: true,
                  validate: (v: unknown) => {
                    const str = String(v || '');
                    return !!str.trim();
                  },
                })}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="EX) 500mm × 100m"
                label="규격"
                required
                {...register('spec', {
                  required: true,
                  validate: (v: unknown) => {
                    const str = String(v || '');
                    return !!str.trim();
                  },
                })}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, spec: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="EX) EA"
                label="단위"
                required
                {...register('unit', {
                  required: true,
                  validate: (v: unknown) => {
                    const str = String(v || '');
                    return !!str.trim();
                  },
                })}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, unit: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="EX) 100"
                label="사용 수량"
                required
                type="text"
                {...register('quantity', {
                  required: true,
                  validate: (v) => {
                    const num = Number(String(v).replace(/[^0-9.]/g, ''));
                    return !isNaN(num) && num > 0;
                  },
                  setValueAs: (v) => {
                    if (v === '' || v === null || v === undefined) return null;
                    const num = Number(String(v).replace(/[^0-9.]/g, ''));
                    return num === 0 ? null : num;
                  },
                })}
                onChange={(e) => {
                  const result = handleQuantityInput(e.target.value);

                  // 입력 필드에 포맷된 값 표시
                  e.target.value = result.displayValue;

                  // formValues 업데이트
                  const num =
                    result.isValid && result.numericValue > 0
                      ? result.numericValue
                      : null;
                  setFormValues((prev) => ({ ...prev, quantity: num }));
                }}
              />
            </div>
            {!noPrice && (
              <div className="flex-1">
                <Input
                  placeholder="EX) 1,000"
                  label="단가"
                  required
                  type="text"
                  {...register('price', {
                    required: true,
                    validate: (v) => {
                      const num = Number(String(v).replace(/[^0-9]/g, ''));
                      return !isNaN(num) && num > 0;
                    },
                    setValueAs: (v) => {
                      if (v === '' || v === null || v === undefined)
                        return null;
                      const num = Number(String(v).replace(/[^0-9]/g, ''));
                      return num === 0 ? null : num;
                    },
                  })}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                    const formatted = onlyNums
                      ? parseInt(onlyNums).toLocaleString()
                      : '';
                    e.target.value = formatted;

                    const num = onlyNums ? parseInt(onlyNums) : null;
                    setFormValues((prev) => ({ ...prev, price: num }));
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-3">
          <MiniBtn
            text="취소"
            variant="white"
            type="button"
            onClick={() => setIsManualAddMode(false)}
          />
          <MiniBtn
            text="추가"
            variant="primary"
            type="submit"
            disabled={!isFormValid()}
          />
        </div>
      </form>
    </div>
  );
};

export default ManualAddMaterial;
