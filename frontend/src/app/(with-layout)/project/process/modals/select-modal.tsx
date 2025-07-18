import { ClientDataModel } from '@/types/data-model';
import Modal from '@/ui/modal/modal';
import { Upload, Keyboard } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';

interface SelectModalProps {
  onClose: () => void;
  onUploadClick: () => void;
  onDirectInputClick: (clientData?: ClientDataModel) => void;
}

const SelectModal = ({
  onClose,
  onUploadClick,
  onDirectInputClick,
}: SelectModalProps) => {
  const router = useRouter();

  const handleGoToQuotation = () => {
    onDirectInputClick(); // 빈 값으로 설정
    router.push('/quotation');
  };

  const handleUploadClick = () => {
    onUploadClick(); // upload-modal 열기만 하고, clientData는 upload-modal에서 처리
  };

  return (
    <Modal
      title="견적 요청서를 등록해주세요."
      subtitle="이미지 파일 형식의 요청서를 등록하거나 직접 입력할 수 있어요."
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="mt-6 flex gap-2.5">
        <div
          role="button"
          tabIndex={0}
          onClick={handleUploadClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleUploadClick();
          }}
          className="group flex flex-1 flex-col h-[215px] items-center justify-center gap-2.5 border-1 border-lg rounded-lg hover:border-primary hover:cursor-pointer"
        >
          <Upload
            size={32}
            weight="fill"
            className="text-lg group-hover:text-primary transition-colors duration-200"
          />
          <p className="Me_Body-2 text-sv group-hover:text-primary transition-colors duration-200">
            견적요청서 업로드
          </p>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={handleGoToQuotation}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleGoToQuotation();
          }}
          className="group flex flex-1 flex-col h-[215px] items-center justify-center gap-2.5 border-1 border-lg rounded-lg hover:border-primary hover:cursor-pointer"
        >
          <Keyboard
            size={32}
            weight="fill"
            className="text-lg group-hover:text-primary"
          />
          <p className="Me_Body-2 text-sv group-hover:text-primary">
            견적서 직접 입력
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default SelectModal;
