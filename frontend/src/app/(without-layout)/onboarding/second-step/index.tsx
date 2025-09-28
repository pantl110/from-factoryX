import { useEffect, useState, useRef, useCallback } from 'react';
import InfoLabelValue from '@/ui/info-label-value';
import MiniBtn from '@/ui/mini-btn';
import { Plus, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import MaterialInputItem from './material-input-item';
import { useForm, useFieldArray, Resolver, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { SecondStepFormDataModel } from '../types';
import { useGetProduct, useAssignMaterialProduct, useToast } from '@/hooks';
import Toast from '@/ui/toast';

interface SecondStepProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

// Yup 스키마 정의
const validationSchema = yup.object({
  materials: yup
    .array()
    .of(
      yup.object({
        materialName: yup.string().required('자재명을 입력해주세요.'),
        materialCode: yup.string().required('자재코드를 입력해주세요.'),
        spec: yup.string().required('규격을 입력해주세요.'),
        unit: yup.string().required('단위를 입력해주세요.'),
        usageQuantity: yup
          .number()
          .required('사용 수량을 입력해주세요.')
          .positive('사용 수량은 양수여야 합니다.')
          .test(
            'decimal',
            '소수점은 한자리까지만 입력 가능합니다.',
            (value) => {
              if (value === undefined || value === null) return true;
              const decimalPlaces = value.toString().split('.')[1]?.length || 0;
              return decimalPlaces <= 1;
            }
          ),
      })
    )
    .min(1)
    .required(),
});

const SecondStep = ({ onNextStep, onPrevStep }: SecondStepProps) => {
  const {
    register,
    handleSubmit,
    formState: { isValid },
    clearErrors,
    control,
    reset,
    setValue,
  } = useForm<SecondStepFormDataModel>({
    resolver: yupResolver(
      validationSchema
    ) as unknown as Resolver<SecondStepFormDataModel>,
    mode: 'onChange',
    defaultValues: {
      materials: [
        {
          materialName: '',
          materialCode: '',
          spec: '',
          unit: '',
          usageQuantity: 0,
        },
      ],
    },
  });

  // 특정 필드들을 감시
  const watchedMaterials = useWatch({
    control,
    name: 'materials',
  });

  // watchedMaterials가 변경될 때마다 유효성 검사 실행
  useEffect(() => {
    // 폼의 유효성 검사는 자동으로 실행됨
  }, [watchedMaterials]);

  const { assignMaterialProduct, isLoading } = useAssignMaterialProduct();
  const { getProductList } = useGetProduct();
  const { isToastOpen, isVisible, showToast } = useToast(3000);
  const [firstProduct, setFirstProduct] = useState<{
    name: string;
    code: string;
    spec: string;
    unit: string;
  } | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 자재 코드 중복 검사 함수
  const checkDuplicateMaterialCodes = (
    materials: SecondStepFormDataModel['materials']
  ) => {
    const codes = materials
      .map((material) => material.materialCode)
      .filter((code) => code.trim() !== '');
    const uniqueCodes = new Set(codes);
    return codes.length !== uniqueCodes.size;
  };

  // 중복되는 자재코드 찾기 함수
  const findDuplicateMaterialCodes = (
    materials: SecondStepFormDataModel['materials']
  ) => {
    const codeCounts: { [key: string]: number[] } = {};

    materials.forEach((material, index) => {
      const code = material.materialCode.trim();
      if (code !== '') {
        if (!codeCounts[code]) {
          codeCounts[code] = [];
        }
        codeCounts[code].push(index);
      }
    });

    const duplicates: number[] = [];
    Object.values(codeCounts).forEach((indices) => {
      if (indices.length > 1) {
        // 첫 번째는 유지하고 나머지는 중복으로 처리
        duplicates.push(...indices.slice(1));
      }
    });

    return duplicates;
  };

  // 첫 번째 품목 정보 가져오기
  useEffect(() => {
    const fetchFirstProduct = async () => {
      const result = await getProductList();
      if (result.success && result.data?.data && result.data.data.length > 0) {
        const product = result.data.data[0];
        setFirstProduct({
          name: product.name || '',
          code: product.code || '',
          spec: product.spec || '',
          unit: product.unit || '',
        });
      }
    };

    fetchFirstProduct();
  }, [getProductList]);

  // sessionStorage에서 데이터 복원
  useEffect(() => {
    const savedData = sessionStorage.getItem('onboarding-step2-materials');

    if (savedData) {
      try {
        const data = JSON.parse(savedData);

        // 데이터 구조 확인
        if (data.materials !== undefined) {
          reset(data);
        }
      } catch (error) {
        console.error('SecondStep 데이터 파싱 오류:', error);
      }
    }
  }, [reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'materials',
  });

  // 실시간으로 자재 코드 중복 검사 (디바운스 적용)
  const debouncedDuplicateCheck = useCallback(() => {
    if (watchedMaterials && watchedMaterials.length > 1) {
      const hasDuplicates = checkDuplicateMaterialCodes(watchedMaterials);
      if (hasDuplicates) {
        showToast();

        // 중복되는 자재코드 찾기
        const duplicateIndices = findDuplicateMaterialCodes(watchedMaterials);

        // 중복되는 자재코드의 input값을 초기화
        if (duplicateIndices.length > 0) {
          duplicateIndices.forEach((index) => {
            setValue(`materials.${index}.materialCode`, '');
          });
        }
      }
    }
  }, [watchedMaterials, showToast, setValue]);

  useEffect(() => {
    if (watchedMaterials && watchedMaterials.length > 1) {
      // 기존 타이머가 있으면 클리어
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // 새로운 타이머 설정 (0.8초 후 검사)
      const timer = setTimeout(() => {
        debouncedDuplicateCheck();
      }, 800);

      debounceTimer.current = timer;
    }

    // 컴포넌트 언마운트 시 타이머 클리어
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [watchedMaterials, debouncedDuplicateCheck]);

  const handleAddMaterial = useCallback(() => {
    clearErrors();
    append({
      materialName: '',
      materialCode: '',
      spec: '',
      unit: '',
      usageQuantity: 0,
    });
  }, [append, clearErrors]);

  const handleDeleteMaterial = useCallback(
    (index: number) => {
      clearErrors();
      remove(index);
    },
    [remove, clearErrors]
  );

  const onSubmit = async (data: SecondStepFormDataModel) => {
    sessionStorage.setItem('onboarding-step2-materials', JSON.stringify(data));

    // 자재 코드 중복이 있으면 제출하지 않음
    if (checkDuplicateMaterialCodes(data.materials)) {
      return;
    }

    try {
      // sessionStorage에서 생성된 품목 ID 가져오기
      const productId = sessionStorage.getItem('onboarding-product-id');
      if (!productId) {
        alert(
          '품목 정보를 찾을 수 없습니다. 이전을 눌러 품목 등록을 다시 진행해주세요.'
        );
        return;
      }

      // 원자재 데이터 변환
      const materials = data.materials.map((material) => ({
        name: material.materialName,
        code: material.materialCode,
        spec: material.spec,
        unit: material.unit,
        quantity: material.usageQuantity === 0 ? null : material.usageQuantity,
        price: null, // 가격은 null로 설정
      }));

      // 원자재 생성 및 품목 연결
      const result = await assignMaterialProduct({
        product_id: parseInt(productId),
        materials,
      });

      if (result.success) {
        onNextStep();
      } else {
        alert('원자재 생성 및 연결에 실패했습니다: ' + result.error);
      }
    } catch {
      alert('원자재 생성 및 연결 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <div className="bg-wh z-1 w-[800px] pt-10 px-8 flex flex-col gap-7 items-center rounded-lg max-h-[85vh]">
        <div className="flex flex-col gap-8 w-full">
          {/* 타이틀 영역 */}
          <div className="flex flex-col gap-2 items-center">
            <h3 className="Heading-3 text-primary">
              해당 품목을 만들 때 필요한 원자재를 추가해 주세요.
            </h3>
            <div className="Me_Body-2 text-bl text-center">
              운영을 시작하려면 먼저 품목과 설비 정보를 등록해야 해요.
              <br />
              등록이 완료되면 생산부터 재고까지 한눈에 관리할 수 있어요!
            </div>
          </div>

          {/* 표 영역  */}
          <div className="w-full">
            <div className="flex">
              <InfoLabelValue label="품목명" value={firstProduct?.name || ''} />
              <InfoLabelValue
                label="품목코드"
                value={firstProduct?.code || ''}
              />
            </div>
            <div className="flex">
              <InfoLabelValue label="규격" value={firstProduct?.spec || ''} />
              <InfoLabelValue label="단위" value={firstProduct?.unit || ''} />
            </div>
          </div>
        </div>

        {/* input container */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-7 h-full overflow-y-auto scrollbar-hide w-full"
        >
          <div className="flex flex-col gap-5 h-full">
            {fields.map((field, index) => (
              <MaterialInputItem
                plusMode={index === 0 ? false : true}
                key={field.id}
                onDelete={
                  index === 0 ? undefined : () => handleDeleteMaterial(index)
                }
                register={register}
                control={control}
                setValue={setValue}
                index={index}
              />
            ))}

            <button
              type="button"
              onClick={handleAddMaterial}
              disabled={!isValid}
              className={`w-full h-12 min-h-8 flex gap-2 items-center justify-center Re_Body-1 rounded shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${
                isValid
                  ? 'text-sv border border-lg hover:bg-secondary-hover hover:text-dg'
                  : 'bg-lg text-gr'
              }`}
            >
              추가하기
              <Plus size={24} />
            </button>
          </div>

          {/* 모달버튼 영역 */}
          <div className="w-full flex justify-end gap-2.5 mb-8">
            <MiniBtn
              text="이전"
              variant="white"
              onClick={onPrevStep}
              type="button"
            />
            <MiniBtn
              text="다음"
              variant="primary"
              type="submit"
              disabled={!isValid || isLoading || isToastOpen}
            />
          </div>
        </form>
      </div>

      {isToastOpen && (
        <Toast
          text="이미 존재하는 자재코드에요."
          subtext="다른 자재코드로 수정해주세요."
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default SecondStep;
