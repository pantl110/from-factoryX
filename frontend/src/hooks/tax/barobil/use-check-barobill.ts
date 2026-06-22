'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  useBarobillRegister,
  useBarobillCorpCertUrl,
  useBarobillCertCheck,
  useGetMember,
} from '@/hooks';
import useMemberStore from '@/store/member-store';
import useAuthStore from '@/store/auth-store';
import { UpdateMemberResponseModel } from '@/types/data-model';

// 바로빌 상태 확인 및 인증서 등록 처리 훅
////// api 가져와서 사용하는 로직

export const useCheckBarobill = () => {
  const tErrors = useTranslations('common.errors');
  const { register: registerBarobill } = useBarobillRegister();
  const { getCertUrl } = useBarobillCorpCertUrl();
  const { checkCert } = useBarobillCertCheck();
  const { getMember } = useGetMember();

  // 훅 내부에서 필요한 값들을 가져옴
  const factoryId = useMemberStore((state) => state.factoryId);
  const isBarobillUser = useMemberStore((state) => state.isBarobillUser);
  const memberId = useAuthStore((state) => state.userInfo?.member_id);

  const getCertification = useCallback(
    async (data: { barobill_id: string; barobill_password: string }) => {
      try {
        const certUrlResponse = await getCertUrl({
          barobill_id: data.barobill_id,
          barobill_password: data.barobill_password,
        });

        if (certUrlResponse && certUrlResponse.url) {
          // URL을 반환하고, 새 탭으로 열기는 것은 호출하는 쪽에서 처리
          return certUrlResponse.url;
        }
        return null;
      } catch {
        return null;
      }
    },
    [getCertUrl]
  );

  // 인증서 등록 진행 함수
  const registerCertification = useCallback(async () => {
    if (memberId && factoryId) {
      try {
        const memberResponse = await getMember({
          factory_id: factoryId,
          member_id: memberId,
        });
        if (memberResponse && memberResponse.success && memberResponse.data) {
          const memberData = memberResponse.data as UpdateMemberResponseModel;
          if (memberData.barobill_id && memberData.barobill_password) {
            const result = await getCertification({
              barobill_id: memberData.barobill_id,
              barobill_password: memberData.barobill_password,
            });

            // getCertification이 성공하면 URL을 새 탭으로 열기
            if (result && typeof result === 'string') {
              window.open(result, '_blank');
            }
          }
        }
      } catch {
        // 인증서 등록 진행 중 오류 발생 시 무시하고 계속 진행
        alert(tErrors('certRegisterError'));
      }
    }
  }, [memberId, factoryId, getMember, getCertification, tErrors]);

  const checkBarobill = useCallback(async () => {
    // 1. 바로빌 사용자 등록 여부 확인
    if (!isBarobillUser) {
      const registerResponse = await registerBarobill();
      if (registerResponse) {
        try {
          const certCheckResponse = await checkCert();
          if (certCheckResponse && !certCheckResponse.has_cert) {
            await registerCertification();
          }
        } catch (error) {
          // 인증서 유효성 검사 실패 등의 에러는 다시 throw
          if (
            error instanceof Error &&
            error.message.includes('유효성 검사 실패')
          ) {
            throw error;
          }
          // 그 외의 경우는 인증서 등록 시도
          await registerCertification();
        }
        return true;
      }
    } else {
      // 바로빌 사용자인 경우 인증서 등록 여부만 확인
      try {
        const certCheckResponse = await checkCert();
        if (certCheckResponse && !certCheckResponse.has_cert) {
          await registerCertification();
        } else if (certCheckResponse && certCheckResponse.has_cert) {
          return true;
        }
      } catch (error) {
        // 인증서 유효성 검사 실패 등의 에러는 다시 throw
        if (
          error instanceof Error &&
          error.message.includes('유효성 검사 실패')
        ) {
          throw error;
        }
        // 그 외의 경우는 인증서 등록 시도
        await registerCertification();
      }
      return true;
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    registerBarobill,
    checkCert,
    getMember,
    getCertification,
    registerCertification,
    factoryId,
    isBarobillUser,
    memberId,
  ]);

  return { checkBarobill };
};
