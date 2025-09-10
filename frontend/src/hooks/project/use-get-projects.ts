import { ProjectListResponseModel } from '@/types/data-model';
import { useState, useCallback, useRef, useEffect } from 'react';
import useMemberStore from '@/store/member-store';

interface GetProjectModel {
  status?: string; // ProjectStatusEnum values (comma-separated)
  status_exclude?: string; // ProjectStatusEnum values to exclude (comma-separated)
  search?: string; // 업체명 또는 품목명
  printed_at__isnull?: boolean; // 거래명세서 출력 여부
  order_by?: string; // 정렬 필드 (-start_date, -printed_at, -confirmed_at 등) // default: -start_date
  page?: number;
  page_size?: number;
}

// 각 프로젝트별로 데이터 가공
// - 견적서
// - 제품명
// - 생산시작일
// - 세금계산서 상태 추출
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

        const queryParams = new URLSearchParams();
        queryParams.append('factory_id', factoryId.toString());

        if (params.status) {
          queryParams.append('status', params.status);
        }
        if (params.status_exclude) {
          queryParams.append('status_exclude', params.status_exclude);
        }
        if (params.search) {
          queryParams.append('search', params.search);
        }
        if (params.printed_at__isnull !== undefined) {
          queryParams.append('printed_at__isnull', params.printed_at__isnull.toString());
        }
        if (params.order_by) {
          queryParams.append('order_by', params.order_by);
        }
        if (params.page) {
          queryParams.append('page', params.page.toString());
        }
        if (params.page_size) {
          queryParams.append('page_size', params.page_size.toString());
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project?${queryParams}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: abortController.signal, // AbortController signal 연결
          }
        );

        // 요청이 취소되었는지 확인
        if (abortController.signal.aborted) {
          return { success: false, error: '요청이 취소되었습니다.' };
        }

        if (response.status === 200) {
          const result: ProjectListResponseModel = await response.json();

          // 요청이 취소되었는지 다시 확인
          if (abortController.signal.aborted) {
            return { success: false, error: '요청이 취소되었습니다.' };
          }

          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          setError(errorData.detail || '프로젝트 조회에 실패했습니다.');
          return { success: false, error: errorData.detail };
        }
      } catch (err) {
        // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: false, error: '요청이 취소되었습니다.' };
        }

        setError('서버 연결에 실패했습니다.');
        return { success: false, error: '서버 연결에 실패했습니다.' };
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
