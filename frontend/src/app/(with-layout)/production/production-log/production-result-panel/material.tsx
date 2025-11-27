import { MiniBtn } from '@/ui';
import { MaterialUsage } from './material-usage';
import { Result } from './result';
import { useEffect, useState } from 'react';
import {
  MaterialProductConnectionModel,
  MaterialUsageModel,
  MaterialUsageResponseModel,
} from '@/types/data-model';
import { useCreateOrUpdatePlanMaterialUsageMutation } from '@/hooks';

interface MaterialProps {
  material: MaterialProductConnectionModel;
  productionQuantity: number;
  planId?: number;
  registerSaveHandler?: (fn: () => Promise<void>) => void;
  initialUsages?: MaterialUsageResponseModel[];
}

export const Material = ({
  material,
  productionQuantity,
  planId,
  registerSaveHandler,
  initialUsages,
}: MaterialProps) => {
  const [usages, setUsages] = useState<number[]>([0]);
  const [usageAmounts, setUsageAmounts] = useState<Record<number, number>>({
    0: 0,
  });
  const [usageIsSubstitute, setUsageIsSubstitute] = useState<
    Record<number, boolean>
  >({
    0: false,
  });
  const [usageMaterialIds, setUsageMaterialIds] = useState<
    Record<number, number>
  >({
    0: material.material_id,
  });
  const [resetCounter, setResetCounter] = useState(0);
  const { mutateAsync: saveMaterialUsage } =
    useCreateOrUpdatePlanMaterialUsageMutation();

  // 상위에서 내려준 초기 자재 사용 이력으로 상태 세팅
  useEffect(() => {
    if (!initialUsages || initialUsages.length === 0) return;

    const records: MaterialUsageResponseModel[] = initialUsages;

    // 0,1,2,... 형태의 로컬 usage id로 매핑
    const newUsages = records.map((_, index: number) => index);
    const newUsageAmounts: Record<number, number> = {};
    const newUsageIsSubstitute: Record<number, boolean> = {};
    const newUsageMaterialIds: Record<number, number> = {};

    records.forEach((item: MaterialUsageResponseModel, index: number) => {
      const id = index;
      const amount =
        typeof item.usage_amount === 'string'
          ? parseFloat(item.usage_amount)
          : item.usage_amount;

      newUsageAmounts[id] = Number.isNaN(amount) ? 0 : (amount ?? 0);
      newUsageMaterialIds[id] = item.material_id;
      newUsageIsSubstitute[id] =
        item.original_material_id !== null &&
        item.original_material_id !== undefined &&
        item.original_material_id !== item.material_id;
    });

    setUsages(newUsages);
    setUsageAmounts(newUsageAmounts);
    setUsageIsSubstitute(newUsageIsSubstitute);
    setUsageMaterialIds(newUsageMaterialIds);
  }, [initialUsages]);

  const handleAddUsage = () => {
    setUsages((prev) => {
      // usages 배열은 렌더링 시 reverse되므로,
      // 새 행이 화면의 "맨 아래"에 오도록 ID는 맨 앞에 추가한다.
      const maxId = prev.length ? Math.max(...prev) : -1;
      const newId = maxId + 1;
      setUsageAmounts((prevAmounts) => ({
        ...prevAmounts,
        [newId]: 0,
      }));
      setUsageIsSubstitute((prevFlags) => ({
        ...prevFlags,
        [newId]: false,
      }));
      setUsageMaterialIds((prevIds) => ({
        ...prevIds,
        [newId]: material.material_id,
      }));
      return [newId, ...prev];
    });
  };

  const handleClearUsages = () => {
    setUsages((prev) => {
      const firstId = prev.length ? prev[0] : 0;
      setUsageAmounts({ [firstId]: 0 });
      setUsageIsSubstitute({ [firstId]: false });
      setUsageMaterialIds({ [firstId]: material.material_id });
      setResetCounter((prevCounter) => prevCounter + 1);
      return [firstId];
    });
  };

  const handleDeleteUsage = (id: number) => {
    setUsages((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const next = prev.filter((usageId) => usageId !== id);
      setUsageAmounts((prevAmounts) => {
        const rest = { ...prevAmounts };
        delete rest[id];
        return rest;
      });
      setUsageIsSubstitute((prevFlags) => {
        const rest = { ...prevFlags };
        delete rest[id];
        return rest;
      });
      setUsageMaterialIds((prevIds) => {
        const rest = { ...prevIds };
        delete rest[id];
        return rest;
      });
      return next;
    });
  };

  const handleSaveUsages = async () => {
    if (!planId) {
      // planId가 없으면 서버 저장을 수행하지 않음
      return;
    }

    const payload: MaterialUsageModel[] = usages.map((id) => ({
      plan_id: planId,
      material_id: usageMaterialIds[id] ?? material.material_id,
      original_material_id: usageIsSubstitute[id] ? material.material_id : null,
      usage_amount: usageAmounts[id] ?? 0,
    }));

    await saveMaterialUsage({
      payload,
      invalidateFilters: {
        planId,
        materialId: material.material_id,
      },
    });
  };

  useEffect(() => {
    if (!registerSaveHandler) return;
    // 상위에서 한 번에 실행할 수 있도록 저장 함수 등록
    registerSaveHandler(handleSaveUsages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerSaveHandler]);

  const totalUsage = usages.reduce(
    (sum, id) => sum + (usageAmounts[id] ?? 0),
    0
  );

  const hasSubstitute = usages.some((id) => usageIsSubstitute[id]);

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
          {[...usages]
            .slice()
            .reverse()
            .map((id, index, arr) => {
              const record =
                initialUsages && id < initialUsages.length
                  ? initialUsages[id]
                  : undefined;

              return (
                <MaterialUsage
                  key={id}
                  materialName={
                    // 전체 삭제 이후에는 기준 자재명으로 고정
                    resetCounter > 0
                      ? material.material_name
                      : (record?.material_name ?? material.material_name)
                  }
                  materialId={
                    // 전체 삭제 이후에는 기준 자재 ID로 고정
                    resetCounter > 0
                      ? material.material_id
                      : (record?.material_id ?? material.material_id)
                  }
                  unit={material.material_unit}
                  initialLotNumber={
                    // 전체 삭제 이후에는 LOT 초기화 (빈 값 → 화면에서는 '-')
                    resetCounter > 0
                      ? ''
                      : (record?.material_history_lot_number ??
                        record?.material_repackaging_lot_number ??
                        '')
                  }
                  onDelete={() => handleDeleteUsage(id)}
                  // 화면에서 첫 번째 행은 삭제 불가
                  canDelete={index !== 0}
                  usageAmount={usageAmounts[id] ?? 0}
                  onChangeUsage={(value) =>
                    setUsageAmounts((prev) => ({ ...prev, [id]: value }))
                  }
                  onChangeIsSubstitute={(isSubstitute) =>
                    setUsageIsSubstitute((prev) => ({
                      ...prev,
                      [id]: isSubstitute,
                    }))
                  }
                  resetSignal={resetCounter}
                  onChangeSelectedMaterial={(selectedMaterialId) =>
                    setUsageMaterialIds((prev) => ({
                      ...prev,
                      [id]: selectedMaterialId,
                    }))
                  }
                />
              );
            })}
        </div>

        {/* 로스율 계산 */}
        <Result
          unit={material.material_unit}
          expectedUsage={(material.quantity ?? 0) * productionQuantity}
          totalUsage={totalUsage}
          hasSubstitute={hasSubstitute}
        />
      </div>
    </div>
  );
};
