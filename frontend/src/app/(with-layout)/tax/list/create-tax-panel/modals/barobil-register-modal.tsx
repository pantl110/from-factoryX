import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useForm } from 'react-hook-form';
import { validateEmail } from '@/utils/validation';
import { BarobillCorpRegisterModel } from '@/types/data-model';
import { useBarobill } from '@/hooks/tax/use-barobill';
import useFactoryStore from '@/store/factory-store';

interface BarobilRegisterModalProps {
  onClose: () => void;
}

export const BarobilRegisterModal = ({
  onClose,
}: BarobilRegisterModalProps) => {
  const factoryId = useFactoryStore((state) => state.factoryId);
  const {
    registerCorp,
    addUserToCorp,
    getCorpCertUrl,
    isRegisteringCorp,
    isAddingUser,
    isGettingCertUrl,
  } = useBarobill();

  type FormValuesType = Pick<
    BarobillCorpRegisterModel,
    'barobill_id' | 'barobill_password' | 'barobill_password_confirm'
  >;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    reset,
  } = useForm<FormValuesType>({
    mode: 'onSubmit',
    defaultValues: {
      barobill_id: '',
      barobill_password: '',
      barobill_password_confirm: '',
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: FormValuesType) => {
    if (!factoryId) {
      setError('barobill_id', {
        type: 'manual',
        message: '공장 정보가 없습니다.',
      });
      return;
    }
    try {
      try {
        await registerCorp(data);
      } catch {
        // 기업이 이미 존재하는 경우 등은 무시하고 다음 단계 진행
      }

      await addUserToCorp(data);

      const certRes = await getCorpCertUrl({
        barobill_id: data.barobill_id,
        barobill_password: data.barobill_password,
      });

      if (certRes?.url) {
        window.open(certRes.url, '_blank', 'noopener,noreferrer');
        // noopener, noreferrer는 새 창에서 원 창에 접근하지 못하게, Referer를 보내지 않도록
        reset(); // 폼 리셋
        onClose(); // 모달 닫기
        return;
      }

      setError('barobill_id', {
        type: 'manual',
        message: '인증서 등록 URL을 가져오지 못했습니다.',
      });
    } catch {
      // 훅에서 에러 메시지 관리
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="전자세금계산서 연동이 필요해요."
      subtitle={`세금계산서 발행 기능을 사용하려면 외부 전자세금계산서 계정이 필요해요.\n처음 한 번만 로그인하면 가입과 연동이 동시에 완료돼요.`}
      width="w-[600px]"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 인풋 */}
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
        </div>

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
            disabled={
              !factoryId ||
              isRegisteringCorp ||
              isAddingUser ||
              isGettingCertUrl
            }
          />
        </div>
      </form>
    </Modal>
  );
};
