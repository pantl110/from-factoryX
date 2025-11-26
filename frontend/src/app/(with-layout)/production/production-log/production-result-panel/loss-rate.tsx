import { useEffect, useMemo } from 'react';
import { Material } from './material';
import { useMaterialProduct } from '@/hooks';
import {
  MaterialProductConnectionModel,
  MaterialProductConnectionResponseModel,
} from '@/types/data-model';

interface LossRateProps {
  productId: number;
  productionQuantity: number;
}

export const LossRate = ({ productId, productionQuantity }: LossRateProps) => {
  const { getMaterialProductConnections, data, isLoading } =
    useMaterialProduct();

  useEffect(() => {
    if (productId) {
      void getMaterialProductConnections(productId, 'product');
    }
  }, [productId, getMaterialProductConnections]);

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

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">자재별 로스율 정보</h3>
      <div className="flex flex-col">
        {materials.length === 0 && !isLoading && <></>}
        {materials.map((m) => (
          <Material
            key={m.material_id}
            material={m}
            productionQuantity={productionQuantity}
          />
        ))}
      </div>
    </div>
  );
};
