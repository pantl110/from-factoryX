import { useState } from 'react';
import { MemberListResponseModel } from '@/types/data-model';

interface GetMembersParamsModel {
  factory_id: number;
  page?: number;
  page_size?: number;
}

const useGetMembers = () => {
  const [members, setMembers] = useState<MemberListResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMembers = async (params: GetMembersParamsModel) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('factory_id', params.factory_id.toString());

      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params.page_size) {
        queryParams.append('page_size', params.page_size.toString());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/member?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result: MemberListResponseModel = await response.json();
        // 시스템 관리자(admin) 제외하여 저장
        const filteredData = (result.data || []).filter((m) => m.role !== 'admin');
        const filtered: MemberListResponseModel = {
          ...result,
          data: filteredData,
          count: filteredData.length,
          totalCnt: filteredData.length,
        };
        setMembers(filtered);
        return { success: true, data: filtered };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '멤버 목록을 불러오는데 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch {
      const errorMessage = '서버 연결에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { getMembers, members, isLoading, error };
};

export default useGetMembers;
