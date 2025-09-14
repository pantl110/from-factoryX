import { useCallback } from 'react';
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
        alert('인증서 등록 진행 중 오류가 발생했어요. 다시 시도해주세요.');
      }
    }
  }, [memberId, factoryId, getMember, getCertification]);

  const checkBarobill = useCallback(async () => {
    try {
      // 1. 바로빌 사용자 등록 여부 확인
      if (!isBarobillUser) {
        // 바로빌 사용자가 아니면 자동 등록
        const registerResponse = await registerBarobill();
        if (registerResponse) {
          // 2. 인증서 등록 여부 확인
          try {
            const certCheckResponse = await checkCert();
            if (certCheckResponse && !certCheckResponse.has_cert) {
              // 인증서가 없으면 인증서 등록 진행
              await registerCertification();
            }
          } catch (error) {
            // certCheckResponse에서 오류가 나면 인증서 등록 진행
            await registerCertification();
          }
          return true;
        }
      } else {
        // 바로빌 사용자인 경우 인증서 등록 여부만 확인
        try {
          const certCheckResponse = await checkCert();
          if (certCheckResponse && !certCheckResponse.has_cert) {
            // 인증서가 없으면 인증서 등록 진행
            await registerCertification();
          } else if (certCheckResponse && certCheckResponse.has_cert) {
            return true;
          }
        } catch (error) {
          // certCheckResponse에서 오류가 나면 인증서 등록 진행
          await registerCertification();
        }
        return true;
      }
      return false;
    } catch (error) {
      // 에러를 다시 throw하여 상위에서 처리할 수 있도록 함
      throw error;
    }
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
