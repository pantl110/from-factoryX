import { useState, useEffect } from 'react';
import { useMaterialProduct, useGetMaterial } from '@/hooks';
import { MaterialResponseModel, MaterialProductConnectionModel } from '@/types/data-model';

// 생산 계획 페이지에서 사용하는 자재 상태 확인 훅
export const useMaterialStatus = (productId: number) => {
  const [materialStatus, setMaterialStatus] = useState<'충분' | '부족'>('충분');
  const [isLoading, setIsLoading] = useState(true);

  const { getMaterialProductConnections } = useMaterialProduct();
  const { getMaterialDetail } = useGetMaterial();

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const checkMaterialStatus = async () => {
      setIsLoading(true);
      try {
        // 1. 제품과 연결된 자재들 조회
        const connectionsResult = await getMaterialProductConnections(productId, 'product');
        
        if (!connectionsResult || !Array.isArray(connectionsResult) || connectionsResult.length === 0) {
          // 연결된 자재가 없으면 충분으로 처리
          setMaterialStatus('충분');
          setIsLoading(false);
          return;
        }

        // 2. 각 자재의 상세 정보 조회하여 재고 상태 확인
        const materialPromises = connectionsResult
          .filter(connection => 'material_id' in connection)
          .map(async (connection: MaterialProductConnectionModel) => {
            try {
              const result = await getMaterialDetail(connection.material_id);
              if (result.success && result.data) {
                return result.data as MaterialResponseModel;
              }
              return null;
            } catch {
              return null;
            }
          });

        const materialDetails = await Promise.all(materialPromises);

        // 3. 하나라도 부족하면 '부족', 모두 충분하면 '충분'
        const hasInsufficientMaterial = materialDetails.some(detail => {
          if (!detail) return false;
          
          const { current_stock, standard_stock } = detail;
          if (!current_stock || !standard_stock) return false;
          
          return current_stock < standard_stock; // 부족한 상태
        });

        setMaterialStatus(hasInsufficientMaterial ? '부족' : '충분');
      } catch (error) {
        console.error('자재 상태 확인 중 오류:', error);
        // 오류 발생 시 안전하게 '충분'으로 처리
        setMaterialStatus('충분');
      } finally {
        setIsLoading(false);
      }
    };

    checkMaterialStatus();
  }, [productId, getMaterialProductConnections, getMaterialDetail]);

  return { materialStatus, isLoading };
}; 