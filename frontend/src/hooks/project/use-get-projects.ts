import { ProjectListResponseModel } from '@/types/data-model';
import { useState, useCallback, useRef, useEffect } from 'react';
import useMemberStore from '@/store/member-store';
import axios from 'axios';

interface GetProjectModel {
  status?: string; // ProjectStatusEnum values (comma-separated)
  status_exclude?: string; // ProjectStatusEnum values to exclude (comma-separated)
  search?: string; // 업체명 또는 제품명
  printed_at__isnull?: boolean; // 거래명세서 출력 여부
  order_by?: string; // 정렬 필드 (-start_date, -printed_at, -confirmed_at 등) // default: -start_date
  page?: number;
  page_size?: number;
}

// 🔴 version 2
const useGetProjects = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getProjects = useCallback(
    async (params: GetProjectModel) => {
      // 이전 요청이 진행 중이면 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새로운 AbortController 생성
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          setError('Factory ID를 찾을 수 없습니다.');
          return { success: false, error: 'Factory ID를 찾을 수 없습니다.' };
        }

        const response = await axios.get<ProjectListResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/project`,
          {
            withCredentials: true,
            signal: abortController.signal,
            params: {
              factory_id: factoryId,
              status: params.status,
              status_exclude: params.status_exclude,
              search: params.search,
              printed_at__isnull: params.printed_at__isnull,
              order_by: params.order_by,
              page: params.page,
              page_size: params.page_size,
            },
          }
        );

        if (abortController.signal.aborted) {
          return { success: false, error: '요청이 취소되었습니다.' };
        }

        return { success: true, data: response.data };
      } catch (err: unknown) {
        // 요청이 취소된 경우
        if (
          axios.isCancel(err) ||
          (axios.isAxiosError(err) && err.code === 'ERR_CANCELED')
        ) {
          return { success: false, error: '요청이 취소되었습니다.' };
        }

        const detail = axios.isAxiosError(err)
          ? (err.response?.data as { detail?: string } | undefined)?.detail
          : undefined;
        setError(detail || '프로젝트 조회에 실패했습니다.');
        return { success: false, error: detail };
      } finally {
        // 요청이 취소되지 않았을 때만 로딩 상태 해제
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [factoryId]
  );

  // 컴포넌트 언마운트 시 진행 중인 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { getProjects, isLoading, error };
};

export default useGetProjects;
