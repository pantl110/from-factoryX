import Modal from '@/ui/modal/modal';
import SubstituteMaterialItem from './substitute-material-item';

interface SubstituteMaterialsModalProps {
  onClose: () => void;
}

const SubstituteMaterialsModal = ({
  onClose,
}: SubstituteMaterialsModalProps) => {
  return (
    <Modal onClose={onClose} title="대체자재" width="w-[700px]">
      <div className="mt-4 flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
        <p className="flex-1 px-3 text-sv">자재명</p>
        <p className="flex-1 px-3 text-sv">자재코드</p>
        <p className="flex-1 px-3 text-sv">규격</p>
        <p className="flex-1 px-3 text-sv">단위</p>
        <p className="flex-1 px-3 text-sv">우선순위</p>
        <p className="flex-1 px-3 text-sv">액션</p>
      </div>

      <SubstituteMaterialItem />
    </Modal>
  );
};

export default SubstituteMaterialsModal;
