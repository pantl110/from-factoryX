import { ProjectListResponseModel } from '@/types/data-model';
import { ProjectStatusType } from '@/types/status-type';
import { useState } from 'react';

interface GetProjectModel {
  factory_id: number;
  status: ProjectStatusType | 'progress';
  // search?: string; // 업체명 또는 품목명
  order_by?: 'start_date' | 'due_date';
  order_dir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

// 각 프로젝트별로 데이터 가공
// - 견적서
// - 제품명
// - 생산시작일
// - 세금계산서 상태 추출
const useGetProjects = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjects = async (params: GetProjectModel) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('factory_id', params.factory_id.toString());
      queryParams.append('status', params.status);

      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params.size) {
        queryParams.append('size', params.size.toString());
      }
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.order_by) {
        queryParams.append('order_by', params.order_by);
      }
      if (params.order_dir) {
        queryParams.append('order_dir', params.order_dir);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const result: ProjectListResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '프로젝트 조회에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { getProjects, isLoading, error };
};

export default useGetProjects;
