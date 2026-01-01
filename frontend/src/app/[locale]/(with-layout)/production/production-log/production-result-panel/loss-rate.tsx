'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Material } from './material';
import {
  useMaterialProduct,
  useMaterialUsageListMutation,
  useCreateOrUpdateMaterialUsageMutation,
} from '@/hooks';
import {
  MaterialProductConnectionModel,
  MaterialProductConnectionResponseModel,
  MaterialUsageModel,
  MaterialUsageResponseModel,
} from '@/types/data-model';
import { MaterialUsageFormModel } from './material-usage';

interface LossRateProps {
  productId: number;
  productionQuantity: number;
  planId?: number;
  onRegisterSaveAllMaterialUsage?: (fn: () => Promise<void>) => void;
  onIsDirtyChange?: (isDirty: boolean) => void;
  onRegisterCheckMaterialConsumed?: (fn: () => boolean) => void;
}

export const LossRate = ({
  productId,
  productionQuantity,
  planId,
  onRegisterSaveAllMaterialUsage,
  onIsDirtyChange,
  onRegisterCheckMaterialConsumed,
}: LossRateProps) => {
  const t = useTranslations('production.lossRate');
  const { getMaterialProductConnections, data, isLoading } =
    useMaterialProduct();
  const materialSaveHandlersRef = useRef<
    Array<() => Promise<MaterialUsageModel[]>>
  >([]);
  const materialGetCurrentDataHandlersRef = useRef<
    Array<() => MaterialUsageFormModel[]>
  >([]);
  const { mutateAsync: fetchMaterialUsages } = useMaterialUsageListMutation();
  const { mutateAsync: saveMaterialUsage } =
    useCreateOrUpdateMaterialUsageMutation();
  const [allUsages, setAllUsages] = useState<MaterialUsageResponseModel[]>([]);
  const materialDirtyStatesRef = useRef<Map<number, boolean>>(new Map());

  useEffect(() => {
    if (productId) {
      void getMaterialProductConnections(productId, 'product');
    }
  }, [productId, getMaterialProductConnections]);

  // plan 단위로 자재 사용 이력을 조회
  useEffect(() => {
    const loadAllUsages = async () => {
      if (!planId) return;
      try {
        const data = await fetchMaterialUsages({ planId });
        setAllUsages((data || []) as MaterialUsageResponseModel[]);
      } catch {
        setAllUsages([]);
      }
    };

    void loadAllUsages();
    // planId가 변경되면 materialDirtyStatesRef 초기화
    materialDirtyStatesRef.current.clear();
  }, [planId, fetchMaterialUsages]);

  const materials = useMemo<MaterialProductConnectionModel[]>(() => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data as MaterialProductConnectionModel[];
    }

    const response = data as MaterialProductConnectionResponseModel;
    if (Array.isArray(response.created_connections)) {
      return response.created_connections as MaterialProductConnectionModel[];
    }

    return [];
  }, [data]);

  // 상위에서 전체 자재 사용 저장을 한 번에 호출할 수 있도록 핸들러 등록
  useEffect(() => {
    if (!onRegisterSaveAllMaterialUsage) return;

    onRegisterSaveAllMaterialUsage(async () => {
      if (!planId) return;

      // 저장 함수 실행 시점에 현재 등록된 핸들러들을 수집
      const fns = materialSaveHandlersRef.current;
      if (!fns.length) return;

      // 모든 자재의 usage payload를 모아서 한 번에 저장
      const allPayloads: MaterialUsageModel[] = [];
      for (const fn of fns) {
        const payload = await fn();
        allPayloads.push(...payload);
      }

      // 모든 payload를 한 번에 저장
      if (allPayloads.length > 0) {
        await saveMaterialUsage({
          payload: allPayloads,
          invalidateFilters: { planId, materialId: undefined },
        });
      }
    });
  }, [onRegisterSaveAllMaterialUsage, planId, saveMaterialUsage]);

  // Material의 isDirty 상태 변경 핸들러
  const handleMaterialDirtyChange = useCallback(
    (materialId: number) => (isDirty: boolean) => {
      materialDirtyStatesRef.current.set(materialId, isDirty);
      // 모든 Material의 isDirty 상태를 확인
      const hasAnyMaterialDirty = Array.from(
        materialDirtyStatesRef.current.values()
      ).some((dirty) => dirty);
      onIsDirtyChange?.(hasAnyMaterialDirty);
    },
    [onIsDirtyChange]
  );

  // material consumed 상태 확인 함수 등록
  useEffect(() => {
    if (!onRegisterCheckMaterialConsumed) return;

    onRegisterCheckMaterialConsumed(() => {
      // 모든 connection에 있는 material이 각자 하나 이상의 MaterialUsage를 갖고 있는지 확인
      if (materials.length === 0) return false;

      // 모든 material의 핸들러가 등록되었는지 확인
      if (
        materialGetCurrentDataHandlersRef.current.length !== materials.length
      ) {
        return false;
      }

      // 각 material에 대해 확인
      for (let i = 0; i < materials.length; i++) {
        const getCurrentData = materialGetCurrentDataHandlersRef.current[i];
        if (!getCurrentData) return false;

        const usages = getCurrentData();

        // 하나 이상의 MaterialUsage가 있어야 함
        if (usages.length === 0) return false;

        // 모든 MaterialUsage의 from이 채워져 있어야 함
        // from은 material_history_id 또는 material_repackaging_id 중 하나가 있어야 함
        const isAllFromFilled = usages.every(
          (usage) =>
            usage.material_history_id !== null ||
            usage.material_repackaging_id !== null
        );

        if (!isAllFromFilled) return false;
      }

      return true;
    });
  }, [onRegisterCheckMaterialConsumed, materials]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">{t('title')}</h3>
      <div className="flex flex-col">
        {materials.length === 0 && !isLoading && <></>}
        {/* 매 렌더링마다 전체 핸들러 배열 초기화 후, 각 자재별 저장 함수를 쌓는다 */}
        {(() => {
          materialSaveHandlersRef.current = [];
          materialGetCurrentDataHandlersRef.current = [];
          return materials.map((m) => {
            const initialUsagesForMaterial = allUsages.filter(
              (item) =>
                (item.original_material_id ?? item.material_id) ===
                m.material_id
            );

            return (
              <Material
                key={m.material_id}
                material={m} // 기준 자재 (bom에 정의된 자재중 하나)
                productionQuantity={productionQuantity}
                planId={planId}
                initialUsages={initialUsagesForMaterial}
                onIsDirtyChange={handleMaterialDirtyChange(m.material_id)}
                onRegisterSaveHandler={(fn) => {
                  materialSaveHandlersRef.current.push(fn);
                }}
                onRegisterGetCurrentDataHandler={(fn) => {
                  materialGetCurrentDataHandlersRef.current.push(fn);
                }}
              />
            );
          });
        })()}
      </div>
    </div>
  );
};
