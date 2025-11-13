import { useState, useCallback } from 'react';
import axios from 'axios';
import useMemberStore from '@/store/member-store';

interface DeleteSubstituteResponseModel {
  message: string;
  deleted_substitute_id: number;
}

interface UseDeleteSubstituteReturnModel {
  deleteSubstitute: (substituteId: number) => Promise<{
    success: boolean;
    data?: DeleteSubstituteResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

const useDeleteSubstitute = (): UseDeleteSubstituteReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const factoryId = useMemberStore((state) => state.factoryId);

  const deleteSubstitute = useCallback(
    async (substituteId: number) => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      if (!factoryId) {
        const errorMessage = '공장 정보가 없습니다. 잠시 후 다시 시도해주세요.';
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }

      try {
        const response = await axios.delete<DeleteSubstituteResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/substitute/relation/${substituteId}`,
          {
            params: {
              factory_id: factoryId,
            },
            withCredentials: true,
          }
        );

        setIsSuccess(true);
        return { success: true, data: response.data };
      } catch (err: unknown) {
        const errorMessage =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return {
    deleteSubstitute,
    isLoading,
    error,
    isSuccess,
  };
};

export default useDeleteSubstitute;
