'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import { SubstituteDetailResponseModel } from '@/types/data-model';

interface UseGetSubstitutesByMaterialReturnModel {
  getSubstitutesByMaterial: (materialId: number) => Promise<{
    success: boolean;
    data?: SubstituteDetailResponseModel[];
    error?: string;
  }>;
  substituteRelations: SubstituteDetailResponseModel[];
  isLoading: boolean;
  error: string | null;
}

const useGetSubstitutesByMaterial =
  (): UseGetSubstitutesByMaterialReturnModel => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [substituteRelations, setSubstituteRelations] = useState<
      SubstituteDetailResponseModel[]
    >([]);
    const factoryId = useMemberStore((state) => state.factoryId);

    // 자재 ID로 해당 자재가 source_material인 대체 자재 관계들 조회
    const getSubstitutesByMaterial = useCallback(
      async (materialId: number) => {
        setIsLoading(true);
        setError(null);

        if (!factoryId) {
          setSubstituteRelations([]);
          setIsLoading(false);
          return { success: true, data: [] };
        }

        try {
          const response = await axios.get<SubstituteDetailResponseModel[]>(
            `${process.env.NEXT_PUBLIC_API_URL}/v2/substitute/${materialId}`,
            {
              params: {
                factory_id: factoryId,
              },
              withCredentials: true,
            }
          );

          setSubstituteRelations(response.data);
          return { success: true, data: response.data };
        } catch (err: unknown) {
          const errorMessage =
            (err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail ||
            '해당 자재의 대체 가능한 자재를 불러오지 못했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        } finally {
          setIsLoading(false);
        }
      },
      [factoryId]
    );

    return {
      getSubstitutesByMaterial,
      substituteRelations,
      isLoading,
      error,
    };
  };

export default useGetSubstitutesByMaterial;
