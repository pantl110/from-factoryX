import MiniBtn from '@/ui/mini-btn'
import Modal from '@/ui/modal/modal'

interface DeleteModalProps {
  onClose: () => void
  onDelete?: () => void
  isLoading?: boolean
}

const DeleteModal = ({ onClose, onDelete, isLoading = false }: DeleteModalProps) => {
  return (
    <Modal
      title="삭제하시겠습니까?"
      subtitle="이 작업은 되돌릴 수 없어요. 선택한 항목이 영구적으로 삭제돼요."
      sm={true}
      onClose={onClose}
    >
      <div className="flex gap-[5px] justify-end mt-4">
        <MiniBtn text="취소" textColor="text-sv" onClick={onClose} hoverColor="" />
        <MiniBtn
          text="삭제"
          textColor="text-red"
          bgColor="bg-red-8"
          onClick={onDelete}
          hoverColor="hover:bg-red-hover"
          disabled={isLoading}
        />
      </div>
    </Modal>
  )
}

export default DeleteModal
