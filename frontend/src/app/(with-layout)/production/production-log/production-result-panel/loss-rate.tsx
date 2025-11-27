import { useEffect, useMemo, useRef, useState } from 'react';
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

interface LossRateProps {
  productId: number;
  productionQuantity: number;
  planId?: number;
  onRegisterSaveAllMaterialUsage?: (fn: () => Promise<void>) => void;
}

export const LossRate = ({
  productId,
  productionQuantity,
  planId,
  onRegisterSaveAllMaterialUsage,
}: LossRateProps) => {
  const { getMaterialProductConnections, data, isLoading } =
    useMaterialProduct();
  const materialSaveHandlersRef = useRef<
    Array<() => Promise<MaterialUsageModel[]>>
  >([]);
  const { mutateAsync: fetchMaterialUsages } = useMaterialUsageListMutation();
  const { mutateAsync: saveMaterialUsage } =
    useCreateOrUpdateMaterialUsageMutation();
  const [allUsages, setAllUsages] = useState<MaterialUsageResponseModel[]>([]);

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

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">자재 투입량 정보</h3>
      <div className="flex flex-col">
        {materials.length === 0 && !isLoading && <></>}
        {/* 매 렌더링마다 전체 핸들러 배열 초기화 후, 각 자재별 저장 함수를 쌓는다 */}
        {(() => {
          materialSaveHandlersRef.current = [];
          return materials.map((m) => {
            const initialUsagesForMaterial = allUsages.filter(
              (item) =>
                (item.original_material_id ?? item.material_id) ===
                m.material_id
            );

            return (
              <Material
                key={m.material_id}
                material={m}
                productionQuantity={productionQuantity}
                planId={planId}
                initialUsages={initialUsagesForMaterial}
                registerSaveHandler={(fn) => {
                  materialSaveHandlersRef.current.push(fn);
                }}
              />
            );
          });
        })()}
      </div>
    </div>
  );
};
