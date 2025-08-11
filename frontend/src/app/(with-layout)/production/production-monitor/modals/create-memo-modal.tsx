import { useForm } from 'react-hook-form';
import { useParams } from 'next/navigation';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import useCreateProjectLog from '@/hooks/project/project-log/use-create-project-log';

interface CreateMemoFormDataModel {
  title: string;
  content: string;
}

interface CreateMemoModalProps {
  onClose: () => void;
  onSuccess?: () => void; // 메모 생성 성공 시 콜백
}

const CreateMemoModal = ({ onClose, onSuccess }: CreateMemoModalProps) => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;

  const { createProjectLog, isLoading } = useCreateProjectLog();

  const {
    register,
    handleSubmit,
    formState: { isValid },
    reset,
  } = useForm<CreateMemoFormDataModel>({
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = async (data: CreateMemoFormDataModel) => {
    if (!projectId) {
      alert('프로젝트 정보를 찾을 수 없습니다.');
      return;
    }

    const result = await createProjectLog({
      project_id: projectId,
      type: '메모',
      title: data.title,
      content: data.content,
    });

    if (result.success) {
      reset();
      onSuccess?.(); // 부모 컴포넌트에 성공 알림
      onClose();
    } else {
      alert(
        `메모 생성에 실패했습니다: ${result.error || '알 수 없는 오류가 발생했습니다.'}`
      );
    }
  };

  return (
    <Modal
      title="생산 메모를 등록해 주세요."
      subtitle="입력된 메모는 생산 현황에서 확인할 수 있어요."
      width="w-[600px]"
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col min-h-0 h-full"
      >
        <input
          {...register('title', { required: '제목을 입력해주세요.' })}
          className="w-full mt-4 Re_Body-1 text-bl px-3 h-12 border border-lg rounded placeholder:text-sv focus:outline-none"
          placeholder="제목을 입력하세요."
        />
        <textarea
          {...register('content', { required: '내용을 입력해주세요.' })}
          className="placeholder:text-sv resize-none h-[420px] mt-4 Re_Body-1 text-bl px-3 py-5 border border-lg rounded overflow-y-auto scrollbar-hide"
          placeholder="메모를 입력하세요."
        />
        <div className="flex gap-2.5 justify-end mt-4">
          <MiniBtn
            text="취소"
            textColor="text-sv"
            onClick={onClose}
            hoverColor=""
            type="button"
          />
          <MiniBtn
            text="메모 생성"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            type="submit"
            disabled={isLoading || !isValid}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateMemoModal;
