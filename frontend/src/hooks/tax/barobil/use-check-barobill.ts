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

        if (certUrlResponse && certUrlResponse.cert_url) {
          window.open(certUrlResponse.cert_url, '_blank');
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [getCertUrl]
  );

  const checkBarobill = useCallback(async () => {
    try {
      // 1. 바로빌 사용자 등록 여부 확인
      if (!isBarobillUser) {
        // 바로빌 사용자가 아니면 자동 등록
        const registerResponse = await registerBarobill();
        if (registerResponse && registerResponse.success) {
          // 2. 인증서 등록 여부 확인
          const certCheckResponse = await checkCert();
          if (certCheckResponse && !certCheckResponse.has_cert) {
            // 인증서가 없으면 인증서 등록 진행
            if (memberId && factoryId) {
              const memberResponse = await getMember({
                factory_id: factoryId,
                member_id: memberId,
              });
              if (
                memberResponse &&
                memberResponse.success &&
                memberResponse.data
              ) {
                const memberData =
                  memberResponse.data as UpdateMemberResponseModel;
                if (memberData.barobill_id && memberData.barobill_password) {
                  await getCertification({
                    barobill_id: memberData.barobill_id,
                    barobill_password: memberData.barobill_password,
                  });
                }
              }
            }
          }
          return true;
        }
      } else {
        // 바로빌 사용자인 경우 인증서 등록 여부만 확인
        // const certCheckResponse = await checkCert();
        // if (certCheckResponse && !certCheckResponse.has_cert) {
        // 인증서가 없으면 인증서 등록 진행
        if (memberId && factoryId) {
          const memberResponse = await getMember({
            factory_id: factoryId,
            member_id: memberId,
          });
          if (memberResponse && memberResponse.success && memberResponse.data) {
            const memberData = memberResponse.data as UpdateMemberResponseModel;
            if (memberData.barobill_id && memberData.barobill_password) {
              await getCertification({
                barobill_id: memberData.barobill_id,
                barobill_password: memberData.barobill_password,
              });
            }
          }
        }
        // }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [
    registerBarobill,
    checkCert,
    getMember,
    getCertification,
    factoryId,
    isBarobillUser,
    memberId,
  ]);

  return { checkBarobill };
};
