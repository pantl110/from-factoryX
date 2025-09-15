import { MemberRoleType, MemberStatusType } from '@/types/status-type';
import { useState } from 'react';
import axios from 'axios';

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
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/member/${params.member_id}`,
        {
          params: {
            factory_id: params.factory_id,
          },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result: FactoryMemberDetailModel = response.data;
      setMember(result);
      return { success: true, data: result };
    } catch (err) {
      let errorMessage = '서버 연결에 실패했습니다.';

      if (axios.isAxiosError(err)) {
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { getMember, member, isLoading, error };
};

export default useGetMember;
