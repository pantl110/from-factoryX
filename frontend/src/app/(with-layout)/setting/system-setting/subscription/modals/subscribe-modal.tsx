'use client';

import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface SubscribeModalProps {
  onClose: () => void;
  planTitle: string;
  onSubscribe: () => Promise<void> | void;
  isLoading: boolean;
  endDate: string;
  isTrial?: boolean;
}

const SubscribeModal = ({
  onClose,
  planTitle,
  onSubscribe,
  isLoading,
  endDate,
  isTrial = false,
}: SubscribeModalProps) => {
  // 하루 더한 날짜 계산
  const getNextDay = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  return (
    <Modal
      title={
        endDate
          ? `${planTitle}로 변경하시겠어요?`
          : `${planTitle}을 지금 시작할까요?`
      }
      subtitle={
        isTrial && planTitle === 'Partners'
          ? `무료체험이 종료되고 지금부터 ${planTitle}가 적용돼요.`
          : endDate
            ? `${isTrial ? '무료 체험은' : '현재 플랜은'} ${endDate}까지 이용 가능하며,
          ${getNextDay(endDate)}부터 ${planTitle}${planTitle === 'Partners' ? '가' : '이'} 적용돼요.`
            : planTitle === 'Basic'
              ? `서비스 이용에 필요한 모든 기본 기능을 사용할 수 있어요.`
              : `세무/회계 기능까지 모두 이용할 수 있어요.`
      }
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="취소" variant="white" onClick={onClose} />
        <MiniBtn
          text="구독"
          variant="primary"
          onClick={async () => {
            await onSubscribe();
            onClose();
          }}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default SubscribeModal;
