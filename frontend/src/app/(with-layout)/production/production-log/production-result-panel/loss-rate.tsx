import { useEffect, useMemo, useRef, useState } from 'react';
import { Material } from './material';
import { useMaterialProduct, usePlanMaterialUsageListMutation } from '@/hooks';
import {
  MaterialProductConnectionModel,
  MaterialProductConnectionResponseModel,
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
  const materialSaveHandlersRef = useRef<Array<() => Promise<void>>>([]);
  const { mutateAsync: fetchMaterialUsages } =
    usePlanMaterialUsageListMutation();
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
      const fns = materialSaveHandlersRef.current;
      if (!fns.length) return;
      await Promise.all(fns.map((fn) => fn()));
    });
  }, [onRegisterSaveAllMaterialUsage]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">자재별 로스율 정보</h3>
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
