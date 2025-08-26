import { MemberRoleType, MemberStatusType } from '@/types/status-type';
import { useState } from 'react';

interface FactoryMemberDetailModel {
  id: number;
  created_at: string;
  updated_at: string;
  factory: number;
  user: number;
  role: MemberRoleType;
  status: MemberStatusType;
  invited_by: number;
  invited_at: string;
  invitation_token: string;
  invitation_message: string;
  is_barobill_user: boolean;
  barobill_id: string | null;
  barobill_password: string | null;
}

interface GetMemberParamsModel {
  factory_id: number;
  member_id: number;
}

const useGetMember = () => {
  const [member, setMember] = useState<FactoryMemberDetailModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMember = async (params: GetMemberParamsModel) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('factory_id', params.factory_id.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/member/${params.member_id}?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result: FactoryMemberDetailModel = await response.json();
        setMember(result);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '멤버 정보를 불러오는데 실패했습니다.';
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

  return { getMember, member, isLoading, error };
};

export default useGetMember;
