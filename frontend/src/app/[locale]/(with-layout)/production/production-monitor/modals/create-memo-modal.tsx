import { useTranslations } from 'next-intl';
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
  const t = useTranslations('production.productionLog.memo.create');
  const tCommon = useTranslations('common');
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
      alert(t('projectNotFound'));
      return;
    }

    const result = await createProjectLog({
      project_id: projectId,
      type: 'memo',
      title: data.title,
      content: data.content,
    });

    if (result.success) {
      reset();
      onSuccess?.(); // 부모 컴포넌트에 성공 알림
      onClose();
    } else {
      alert(
        t('createFailed', {
          error: result.error || t('unknownError'),
        })
      );
    }
  };

  return (
    <Modal
      title={t('title')}
      subtitle={t('subtitle')}
      width="w-[600px]"
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col min-h-0 h-full"
      >
        <input
          {...register('title', { required: t('titleRequired') })}
          className="w-full mt-4 Re_Body-1 text-bl px-3 h-12 border border-lg rounded placeholder:text-sv focus:outline-none"
          placeholder={t('titlePlaceholder')}
        />
        <textarea
          {...register('content', { required: t('contentRequired') })}
          className="placeholder:text-sv resize-none h-[420px] mt-4 Re_Body-1 text-bl px-3 py-5 border border-lg rounded overflow-y-auto scrollbar-hide"
          placeholder={t('contentPlaceholder')}
        />
        <div className="flex gap-2.5 justify-end mt-4">
          <MiniBtn variant="gray"
            text={tCommon('cancel')}
            onClick={onClose}
            type="button"
          />
          <MiniBtn variant="primary"
            text={t('createButton')}
            type="submit"
            disabled={isLoading || !isValid}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateMemoModal;
