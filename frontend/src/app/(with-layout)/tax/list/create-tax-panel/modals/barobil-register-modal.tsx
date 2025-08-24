import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { BarobillCorpCertModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import {
  useBarobillRegister,
  useBarobillCorpCertUrl,
  useBarobillCertCheck,
} from '@/hooks';

interface BarobilRegisterModalProps {
  onClose: () => void;
}

export const BarobilRegisterModal = ({
  onClose,
}: BarobilRegisterModalProps) => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const isBarobillUser = useMemberStore((state) => state.isBarobillUser);
  const { register: registerBarobill } = useBarobillRegister();
  const { getCertUrl } = useBarobillCorpCertUrl();
  const { checkCert } = useBarobillCertCheck();

  // 인증서 등록
  const getCertification = async (data: BarobillCorpCertModel) => {
    const certRes = await getCertUrl(data);

    if (certRes?.url) {
      window.open(certRes.url, '_blank', 'noopener,noreferrer');
      // noopener, noreferrer는 새 창에서 원 창에 접근하지 못하게, Referer를 보내지 않도록
      onClose(); // 모달 닫기
      return;
    }
  };

  // 인증서 등록 여부 확인
  const checkCertification = async () => {
    const certRes = await checkCert();
    return certRes;
  };

  const onSubmit = async () => {
    if (!factoryId) {
      return;
    }

    try {
      // 1. 회원가입 안되어있으면
      if (!isBarobillUser) {
        // 회원가입 진행
        await registerBarobill();
      }

      // 2. 인증서 등록 여부 확인
      const certCheckRes = await checkCertification();

      if (certCheckRes?.is_valid) {
        // 인증서 등록 되어 있으면
        // 사용 가능
      } else {
        // 인증서 등록 안되어 있으면
        await getCertification({
          factory: factoryId.toString(),
          barobill_id: '',
          barobill_password: '',
        });
      }
    } catch (error) {
      console.error('바로빌 등록 중 오류:', error);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="전자세금계산서 연동이 필요해요."
      subtitle={`세금계산서 발행 기능을 사용하려면 외부 전자세금계산서 계정이 필요해요.\n처음 한 번만 로그인하면 가입과 연동이 동시에 완료돼요.`}
      width="w-[600px]"
    >
      {/* <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col mt-3">
          <div className="flex flex-col">
            <Input
              label="이메일"
              placeholder="이메일을 입력해주세요."
              type="email"
              {...register('barobill_id', {
                required: '이메일을 입력해주세요.',
                validate: (value) => {
                  const error = validateEmail(value);
                  return error || true;
                },
              })}
            />
            <p className="text-red Re_Body-1 mt-1 mb-2 h-5">
              {errors.barobill_id?.message}
            </p>
          </div>

          <div className="flex flex-col">
            <Input
              label="비밀번호"
              placeholder="비밀번호를 입력해주세요."
              type="password"
              {...register('barobill_password', {
                required: '비밀번호를 입력해주세요.',
              })}
            />
            <p className="text-red Re_Body-1 mt-1 mb-2 h-5">
              {errors.barobill_password?.message}
            </p>
          </div>

          <div className="flex flex-col">
            <Input
              label="비밀번호 재입력"
              placeholder="비밀번호를 다시 입력해주세요."
              type="password"
              {...register('barobill_password_confirm', {
                required: '비밀번호를 다시 입력해주세요.',
                validate: (value) => {
                  if (value !== watchedValues.barobill_password) {
                    return '비밀번호가 일치하지 않습니다.';
                  }
                  return true;
                },
              })}
            />
            <p className="text-red Re_Body-1 mt-1 mb-2 h-5">
              {errors.barobill_password_confirm?.message}
            </p>
          </div>
        </div> */}

      {/* 버튼 */}
      <div className="flex gap-[10px] justify-end mt-2">
        <MiniBtn
          text="취소"
          textColor="text-sv"
          hoverColor="hover:bg-bg"
          onClick={onClose}
        />

        <MiniBtn
          text="확인"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          type="submit"
          onClick={onSubmit}
        />
      </div>
      {/* </form> */}
    </Modal>
  );
};
