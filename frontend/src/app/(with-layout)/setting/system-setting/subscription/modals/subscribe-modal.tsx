import MiniBtn from '@/ui/mini-btn'
import Modal from '@/ui/modal/modal'

interface SubscribeModalProps {
  onClose: () => void
  planTitle: string
}

const SubscribeModal = ({ onClose, planTitle }: SubscribeModalProps) => {
  return (
    <Modal
      title={`${planTitle} 플랜을 구독하시겠어요?`}
      subtitle={`아직 무료 체험 기간이 8일 남아있어요.\n결제는 체험 종료 후 자동으로 진행됩니다.`}
      // subtitle={`현재 무료 체험 기간이 8일 남아있어요.\n결제 카드를 미리 등록해두시면, 체험 종료 후 자동으로 전환돼요.`}
      onClose={onClose}
      sm={true}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="취소" textColor="text-sv" onClick={onClose} hoverColor="" />
        <MiniBtn
          text="결제 카드 등록"
          bgColor="bg-primary"
          textColor="text-wh"
          onClick={onClose}
          hoverColor="hover:bg-primary-hover"
        />
      </div>
    </Modal>
  )
}

export default SubscribeModal
