'use client';

import useAuthStore from '@/store/auth-store';
import useMemberStore from '@/store/member-store';
import useGetMember from './factory-member/use-get-member';

const useSetFactoryMember = () => {
  const { userInfo, setUserInfo } = useAuthStore();
  const { setFactoryId, setRole, setIsBarobillUser } = useMemberStore();
  const { getMember } = useGetMember();

  const setFactoryAndMember = async (factoryId: number) => {
    setFactoryId(factoryId);

    let memberId = userInfo?.member_id;
    if (!memberId) {
      try {
        const meRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (meRes.ok) {
          const meData = await meRes.json();
          setUserInfo(meData);
          memberId = meData?.member_id;
        }
      } catch {
        // ignore
      }
    }

    if (memberId) {
      const res = await getMember({
        factory_id: factoryId,
        member_id: memberId,
      });
      if (res.success && res.data) {
        setRole(res.data.role);
        setIsBarobillUser(res.data.is_barobill_user);
      }
    }
  };

  return { setFactoryAndMember };
};

export default useSetFactoryMember;
