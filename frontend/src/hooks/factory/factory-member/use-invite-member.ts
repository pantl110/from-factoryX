'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import useMemberStore from '@/store/member-store';
import {
  InviteMemberModel,
  InviteMemberResponseModel,
} from '@/types/data-model';

interface InviteResponseModel {
  message: string;
  inviting?: InviteMemberResponseModel[]; // 기존 사용자일 때
}

const useInviteMember = () => {
  const t = useTranslations('setting.systemSetting.permission.inviteModal.errors');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const inviteMember = async (payload: InviteMemberModel) => {
    if (!factoryId) {
      const errorMsg = t('factoryNotFound');
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/member/invite?factory_id=${factoryId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result: InviteResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || '멤버 초대에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch {
      const errorMessage = t('serverConnectionFailed');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { inviteMember, isLoading, error };
};

export default useInviteMember;
