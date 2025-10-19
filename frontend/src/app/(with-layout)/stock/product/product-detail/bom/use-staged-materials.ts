import { useState, useCallback } from 'react';
import { useMaterialProduct } from '@/hooks';

interface StagedMaterial {
  id: number;
  name: string;
  code: string;
  spec: string;
  unit: string;
  quantity: number;
}

export const useStagedMaterials = () => {
  const [stagedMaterials, setStagedMaterials] = useState<StagedMaterial[]>([]);
  const { createMaterialProduct } = useMaterialProduct();

  // 생성 모드에서 임시로 담아둔 원자재 연결을 실제로 생성
  const persistStagedConnections = useCallback(async (newProductId: number) => {
    if (stagedMaterials.length === 0) return;
    
    const connections = stagedMaterials.map((m) => ({
      id: m.id,
      quantity: m.quantity ?? 0,
    }));
    
    await createMaterialProduct({
      type: 'product',
      target_id: newProductId,
      connections,
    });
    
    setStagedMaterials([]);
  }, [stagedMaterials, createMaterialProduct]);

  // 스테이징된 수량 변경
  const updateStagedQuantity = useCallback((materialId: number, quantity: number) => {
    setStagedMaterials((prev) =>
      prev.map((m) =>
        m.id === materialId ? { ...m, quantity } : m
      )
    );
  }, []);

  // 스테이징된 자재 추가 (중복 제거)
  const addStagedMaterials = useCallback((materials: StagedMaterial[]) => {
    setStagedMaterials((prev) => {
      const map = new Map<string, StagedMaterial>();
      [...prev, ...materials].forEach((m) => {
        map.set(m.code, m);
      });
      return Array.from(map.values());
    });
  }, []);

  return {
    stagedMaterials,
    persistStagedConnections,
    updateStagedQuantity,
    addStagedMaterials,
  };
};
