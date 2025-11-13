import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import Checkbox from '@/ui/checkbox';
import MiniBtn from '@/ui/mini-btn';
import MaterialItem from './material-item';

interface CreateSubstituteModalProps {
  onClose: () => void;
}

const CreateSubstituteModal = ({ onClose }: CreateSubstituteModalProps) => {
  return (
    <Modal
      onClose={onClose}
      title="대체 가능한 원자재 연결"
      width="w-[800px]"
      scroll={true}
    >
      <div className="mt-4 mb-3 px-6">
        <SearchInput
          placeholder="연결할 원자재 또는 코드를 검색하세요."
          width="w-full"
        />
      </div>

      {/* 표 */}
      <div className="px-6 ">
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
          <Checkbox isChecked={false} onToggle={() => {}} />
          <p className="flex-1 px-3 text-sv">자재명</p>
          <p className="flex-1 px-3 text-sv">자재코드</p>
          <p className="flex-1 px-3 text-sv">규격</p>
          <p className="flex-1 px-3 text-sv">단위</p>
        </div>
        <MaterialItem />
      </div>

      {/* 버튼 */}
      <div className="px-6 flex gap-2.5 justify-end mt-5 pb-6">
        <MiniBtn text="닫기" variant="white" onClick={onClose} />
        <MiniBtn text="연결" variant="primary" onClick={() => {}} />
      </div>
    </Modal>
  );
};

export default CreateSubstituteModal;
