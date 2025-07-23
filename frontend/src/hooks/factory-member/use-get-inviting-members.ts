import { InviteMemberResponseModel } from '@/types/data-model';
import { useState } from 'react';

interface InvitingMembersListResponseModel {
  inviting: InviteMemberResponseModel[];
}

// 내가 초대한(미가입) 멤버 조회
const useGetInvitingMembers = () => {
  const [invitingMembers, setInvitingMembers] = useState<
    InviteMemberResponseModel[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInvitingMembers = async (factoryId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/member/invited?factory_id=${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result: InvitingMembersListResponseModel = await response.json();
        setInvitingMembers(result.inviting);
        return { success: true, data: result.inviting };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '초대 중인 멤버 목록을 불러오는데 실패했습니다.';
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

  return { getInvitingMembers, invitingMembers, isLoading, error };
};

export default useGetInvitingMembers;
