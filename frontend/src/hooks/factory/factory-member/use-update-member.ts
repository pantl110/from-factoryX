import { useState } from 'react';
import { MemberRoleType, MemberStatusType } from '@/types/status-type';
import { UpdateMemberResponseModel } from '@/types/data-model';

interface UpdateMemberParamsModel {
  memberId: number;
  factoryId: number;
  role?: MemberRoleType;
  status?: MemberStatusType;
}

const useUpdateMember = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMember = async (params: UpdateMemberParamsModel) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/member/${params.memberId}?factory_id=${params.factoryId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: params.role,
            status: params.status,
          }),
        }
      );

      if (response.ok) {
        const result: UpdateMemberResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || '멤버 수정에 실패했습니다.';
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

  return { updateMember, isLoading, error };
};

export default useUpdateMember;
