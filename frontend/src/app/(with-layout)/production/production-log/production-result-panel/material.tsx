import { MiniBtn } from '@/ui';
import { MaterialUsage } from './material-usage';
import { Result } from './result';
import { useEffect, useState } from 'react';
import {
  MaterialProductConnectionModel,
  MaterialUsageModel,
  MaterialUsageResponseModel,
} from '@/types/data-model';

interface MaterialProps {
  material: MaterialProductConnectionModel;
  productionQuantity: number;
  planId?: number;
  registerSaveHandler?: (fn: () => Promise<MaterialUsageModel[]>) => void;
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
  const [usageMaterialHistoryIds, setUsageMaterialHistoryIds] = useState<
    Record<number, number | null>
  >({});
  const [usageMaterialRepackagingIds, setUsageMaterialRepackagingIds] =
    useState<Record<number, number | null>>({});
  const [usageDbIds, setUsageDbIds] = useState<
    Record<number, number | undefined>
  >({});
  const [resetCounter, setResetCounter] = useState(0);

  // 상위에서 내려준 초기 자재 사용 이력으로 상태 세팅
  useEffect(() => {
    if (!initialUsages || initialUsages.length === 0) return;

    const records: MaterialUsageResponseModel[] = initialUsages;

    // 0,1,2,... 형태의 로컬 usage id로 매핑
    const newUsages = records.map((_, index: number) => index);
    const newUsageAmounts: Record<number, number> = {};
    const newUsageIsSubstitute: Record<number, boolean> = {};
    const newUsageMaterialIds: Record<number, number> = {};

    const newUsageMaterialHistoryIds: Record<number, number | null> = {};
    const newUsageMaterialRepackagingIds: Record<number, number | null> = {};
    const newUsageDbIds: Record<number, number | undefined> = {};

    records.forEach((item: MaterialUsageResponseModel, index: number) => {
      const id = index;
      const amount =
        typeof item.usage_amount === 'string'
          ? parseFloat(item.usage_amount)
          : item.usage_amount;

      newUsageAmounts[id] = Number.isNaN(amount) ? 0 : (amount ?? 0);
      newUsageMaterialIds[id] = item.material_id;
      newUsageMaterialHistoryIds[id] = item.material_history_id ?? null;
      newUsageMaterialRepackagingIds[id] = item.material_repackaging_id ?? null;
      newUsageDbIds[id] = item.id; // DB의 material usage id 저장
      newUsageIsSubstitute[id] =
        item.original_material_id !== null &&
        item.original_material_id !== undefined &&
        item.original_material_id !== item.material_id;
    });

    setUsages(newUsages);
    setUsageAmounts(newUsageAmounts);
    setUsageIsSubstitute(newUsageIsSubstitute);
    setUsageMaterialIds(newUsageMaterialIds);
    setUsageMaterialHistoryIds(newUsageMaterialHistoryIds);
    setUsageMaterialRepackagingIds(newUsageMaterialRepackagingIds);
    setUsageDbIds(newUsageDbIds);
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
      setUsageMaterialHistoryIds((prev) => ({
        ...prev,
        [newId]: null,
      }));
      setUsageMaterialRepackagingIds((prev) => ({
        ...prev,
        [newId]: null,
      }));
      setUsageDbIds((prev) => ({
        ...prev,
        [newId]: undefined, // 새로 추가한 행은 DB id가 없음
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
      setUsageMaterialHistoryIds({ [firstId]: null });
      setUsageMaterialRepackagingIds({ [firstId]: null });
      setUsageDbIds({ [firstId]: undefined }); // 전체 삭제 후에는 새 행으로 취급
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
      setUsageMaterialHistoryIds((prev) => {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
      setUsageMaterialRepackagingIds((prev) => {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
      setUsageDbIds((prev) => {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
      return next;
    });
  };

  const handleSaveUsages = async (): Promise<MaterialUsageModel[]> => {
    if (!planId) {
      // planId가 없으면 빈 배열 반환
      return [];
    }

    const payload: MaterialUsageModel[] = usages
      .map((id) => {
        const dbId = usageDbIds[id];
        const usageAmount = usageAmounts[id] ?? 0;
        const materialHistoryId = usageMaterialHistoryIds[id] ?? null;
        const materialRepackagingId = usageMaterialRepackagingIds[id] ?? null;

        return {
          // id가 있으면 수정, 없으면 생성
          ...(dbId !== undefined ? { id: dbId } : {}),
          plan_id: planId,
          material_id: usageMaterialIds[id] ?? material.material_id,
          original_material_id: material.material_id,
          usage_amount: usageAmount,
          material_history_id: materialHistoryId,
          material_repackaging_id: materialRepackagingId,
        };
      })
      .filter((item) => {
        // material_history_id와 material_repackaging_id 둘 다 null이면 제외
        // usage_amount가 0이거나 없으면 제외 //
        if (
          (!item.usage_amount || item.usage_amount === 0) &&
          !item.material_history_id &&
          !item.material_repackaging_id
        ) {
          return false;
        }
        return true;
      });

    // payload만 반환 (실제 저장은 LossRate에서 한 번에 처리)
    return payload;
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
            .map((id, index) => {
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
                  onChangeSelectedLot={(lotInfo) => {
                    setUsageMaterialHistoryIds((prev) => ({
                      ...prev,
                      [id]: lotInfo.materialHistoryId,
                    }));
                    setUsageMaterialRepackagingIds((prev) => ({
                      ...prev,
                      [id]: lotInfo.materialRepackagingId,
                    }));
                  }}
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
