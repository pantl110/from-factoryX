import { useState, useEffect } from 'react';
import { useMaterialProduct, useGetMaterial } from '@/hooks';
import {
  MaterialResponseModel,
  MaterialProductConnectionModel,
} from '@/types/data-model';

// 생산계획 & 생산내역 페이지에서 사용하는 자재 상태 확인 훅
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
        const connectionsResult = await getMaterialProductConnections(
          productId,
          'product'
        );

        // API 응답 구조 확인 및 데이터 추출
        const connections = connectionsResult?.data || connectionsResult;

        if (
          !connections ||
          !Array.isArray(connections) ||
          connections.length === 0
        ) {
          // 연결된 자재가 없으면 충분으로 처리
          setMaterialStatus('충분');
          setIsLoading(false);
          return;
        }

        // 2. 각 자재의 상세 정보 조회하여 재고 상태 확인
        const materialPromises = connections
          .filter(
            (connection: MaterialProductConnectionModel) =>
              'material_id' in connection
          )
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

        // 3. 현재 재고 기준으로 자재 부족 여부 확인
        const hasInsufficientMaterial = materialDetails.some(
          (detail: MaterialResponseModel | null) => {
            if (!detail) return false;

            const {
              current_stock: currentStock,
              standard_stock: standardStock,
            } = detail;
            if (currentStock === null || currentStock === undefined)
              return false;
            if (standardStock === null || standardStock === undefined)
              return false;

            // 현재 재고가 안전 재고보다 적으면 부족
            return currentStock < standardStock;
          }
        );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return { materialStatus, isLoading };
};
