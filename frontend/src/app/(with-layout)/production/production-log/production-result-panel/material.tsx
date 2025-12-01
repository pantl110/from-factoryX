import { MiniBtn } from '@/ui';
import { MaterialUsage, MaterialUsageFormData } from './material-usage';
import { Result } from './result';
import {
  MaterialProductConnectionModel,
  MaterialUsageResponseModel,
} from '@/types/data-model';
import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect, useCallback, useRef } from 'react';

interface MaterialProps {
  material: MaterialProductConnectionModel;
  productionQuantity: number;
  planId?: number;
  initialUsages?: MaterialUsageResponseModel[];
  onIsDirtyChange?: (isDirty: boolean) => void;
}

interface MaterialFormData {
  usages: MaterialUsageFormData[];
}

export const Material = ({
  material,
  productionQuantity,
  planId,
  initialUsages,
  onIsDirtyChange,
}: MaterialProps) => {
  const { control, watch, reset, setValue, formState } =
    useForm<MaterialFormData>({
      defaultValues: {
        usages: [],
      },
    });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'usages',
  });

  const prevInitialUsagesIdsRef = useRef<string>('');
  const prevPlanIdRef = useRef<number | undefined>(undefined);
  const materialUsageDirtyStatesRef = useRef<Map<number, boolean>>(new Map());
  const shouldResetAfterAppendRef = useRef<boolean>(false);

  // 초기 데이터가 있으면 폼 초기화
  useEffect(() => {
    if (!planId) return;

    // planId가 변경되면 초기화
    const planIdChanged = prevPlanIdRef.current !== planId;
    if (planIdChanged) {
      prevPlanIdRef.current = planId;
      prevInitialUsagesIdsRef.current = '';
    }

    // initialUsages의 id 배열을 문자열로 변환하여 비교
    const currentIds = initialUsages
      ? initialUsages
          .map((item) => item.id)
          .sort()
          .join(',')
      : '';
    const initialUsagesChanged = prevInitialUsagesIdsRef.current !== currentIds;

    if (!planIdChanged && !initialUsagesChanged) return;

    if (initialUsages && initialUsages.length > 0) {
      const initialFormData: MaterialUsageFormData[] = initialUsages.map(
        (item) => ({
          id: item.id,
          material_id: item.material_id,
          usage_amount:
            typeof item.usage_amount === 'string'
              ? parseFloat(item.usage_amount)
              : (item.usage_amount ?? 0),
          material_history_id: item.material_history_id ?? null,
          material_repackaging_id: item.material_repackaging_id ?? null,
        })
      );
      replace(initialFormData);
      // replace() 후 reset()을 호출하여 isDirty를 false로 만들기
      // reset()에 현재 값을 전달하면 값은 유지하면서 isDirty만 false가 됨
      reset({ usages: initialFormData }, { keepDefaultValues: false });
      prevInitialUsagesIdsRef.current = currentIds;
      shouldResetAfterAppendRef.current = false;
    } else if (initialUsages !== undefined) {
      // initialUsages가 명시적으로 전달되었고 빈 배열인 경우에만 빈 폼 추가
      // (undefined가 아닌 빈 배열 []로 전달된 경우)
      if (fields.length === 0) {
        const emptyFormData = {
          material_id: material.material_id,
          usage_amount: 0,
          material_history_id: null,
          material_repackaging_id: null,
        };
        append(emptyFormData);
        // append()는 비동기이므로 다음 렌더링에서 reset()을 호출하도록 플래그 설정
        shouldResetAfterAppendRef.current = true;
      }
      prevInitialUsagesIdsRef.current = currentIds;
    }
  }, [
    planId,
    initialUsages,
    material.material_id,
    append,
    replace,
    fields.length,
  ]);

  const handleAddUsage = () => {
    append({
      material_id: material.material_id,
      usage_amount: 0,
      material_history_id: null,
      material_repackaging_id: null,
    });
  };

  const handleClearUsages = () => {
    replace([
      {
        material_id: material.material_id,
        usage_amount: 0,
        material_history_id: null,
        material_repackaging_id: null,
      },
    ]);
  };

  const handleDeleteUsage = (index: number) => {
    if (fields.length <= 1) return;
    remove(index);
  };

  const formData = watch('usages');
  const totalUsage = formData.reduce(
    (sum, item) => sum + (item.usage_amount ?? 0),
    0
  );
  const hasSubstitute = formData.some(
    (item) => item.material_id !== material.material_id
  );

  // onChange 핸들러를 useCallback으로 메모이제이션하여 무한 루프 방지
  const handleUsageChange = useCallback(
    (index: number) => (data: MaterialUsageFormData) => {
      setValue(`usages.${index}`, data, { shouldDirty: true });
    },
    [setValue]
  );

  // MaterialUsage의 isDirty 상태 변경 핸들러
  const handleMaterialUsageDirtyChange = useCallback(
    (index: number) => (isDirty: boolean) => {
      materialUsageDirtyStatesRef.current.set(index, isDirty);
      // 모든 MaterialUsage의 isDirty 상태와 Material 폼의 isDirty 상태를 확인
      const anyMaterialUsageDirty = Array.from(
        materialUsageDirtyStatesRef.current.values()
      ).some((dirty) => dirty);
      const isAnyDirty = formState.isDirty || anyMaterialUsageDirty;
      onIsDirtyChange?.(isAnyDirty);
    },
    [formState.isDirty, onIsDirtyChange]
  );

  // append() 후 reset()을 호출하여 isDirty를 false로 만들기
  useEffect(() => {
    if (shouldResetAfterAppendRef.current && fields.length > 0) {
      const currentFormData = watch('usages');
      reset({ usages: currentFormData }, { keepDefaultValues: false });
      shouldResetAfterAppendRef.current = false;
    }
  }, [fields.length, reset, watch]);

  // Material 폼의 isDirty 상태 변경 감지
  useEffect(() => {
    const anyMaterialUsageDirty = Array.from(
      materialUsageDirtyStatesRef.current.values()
    ).some((dirty) => dirty);
    const isAnyDirty = formState.isDirty || anyMaterialUsageDirty;
    onIsDirtyChange?.(isAnyDirty);
  }, [formState.isDirty, onIsDirtyChange]);

  return (
    <div className="flex flex-col gap-5 py-5">
      <div className="flex items-center justify-between">
        <h4 className="Heading-4">
          {material.material_name
            ? `${material.material_name}${material.material_code ? ` (${material.material_code})` : ''}`
            : '-'}
        </h4>
        <div className="flex gap-0">
          <MiniBtn
            text="추가"
            height="h-8"
            textColor="text-sv"
            hoverColor="hover:text-primary"
            borderColor="border-lg"
            onClick={handleAddUsage}
          />
          <MiniBtn
            text="전체 삭제"
            variant="ghost"
            height="h-8"
            onClick={handleClearUsages}
          />
        </div>
      </div>

      <div className="flex flex-col">
        {/* 자재 사용 정보 입력 */}
        <div className="flex flex-col gap-5">
          {planId &&
            fields.map((field, index) => {
              const initialData = initialUsages?.[index];
              const currentFormData = formData[index];

              return (
                <MaterialUsage
                  key={field.id}
                  originalMaterialId={material.material_id}
                  originalMaterialName={material.material_name ?? ''}
                  materialId={
                    currentFormData?.material_id ?? material.material_id
                  }
                  materialName={
                    initialData?.material_name ?? material.material_name ?? ''
                  }
                  unit={material.material_unit ?? ''}
                  initialData={
                    initialData
                      ? {
                          id: initialData.id,
                          material_id: initialData.material_id,
                          usage_amount:
                            typeof initialData.usage_amount === 'string'
                              ? parseFloat(initialData.usage_amount)
                              : (initialData.usage_amount ?? 0),
                          material_history_id:
                            initialData.material_history_id ?? null,
                          material_repackaging_id:
                            initialData.material_repackaging_id ?? null,
                          material_name: initialData.material_name,
                          material_history_lot_number:
                            initialData.material_history_lot_number ?? null,
                          material_repackaging_lot_number:
                            initialData.material_repackaging_lot_number ?? null,
                        }
                      : undefined
                  }
                  onDelete={() => handleDeleteUsage(index)}
                  canDelete={index !== 0}
                  onChange={handleUsageChange(index)}
                  onIsDirtyChange={handleMaterialUsageDirtyChange(index)}
                />
              );
            })}
        </div>

        {/* 로스율 계산 */}
        <Result
          unit={material.material_unit ?? ''}
          expectedUsage={(material.quantity ?? 0) * productionQuantity}
          totalUsage={totalUsage}
          hasSubstitute={hasSubstitute}
        />
      </div>
    </div>
  );
};
