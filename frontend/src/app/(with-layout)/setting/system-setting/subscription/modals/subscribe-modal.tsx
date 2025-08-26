'use client';

import { useState } from 'react';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface SubscribeModalProps {
  onClose: () => void;
  planTitle: string;
  onSubscribe: () => Promise<void> | void;
}

const SubscribeModal = ({
  onClose,
  planTitle,
  onSubscribe,
}: SubscribeModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubscribe();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={`${planTitle} 플랜을 구독하시겠어요?`}
      subtitle={`아직 무료 체험 기간이 8일 남아있어요.\n결제는 체험 종료 후 자동으로 진행됩니다.`}
      // subtitle={`현재 무료 체험 기간이 8일 남아있어요.\n결제 카드를 미리 등록해두시면, 체험 종료 후 자동으로 전환돼요.`}
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text="취소"
          textColor="text-sv"
          onClick={onClose}
          hoverColor="hover:bg-bg"
        />
        <MiniBtn
          text="구독하기"
          bgColor="bg-primary"
          textColor="text-wh"
          onClick={handleSubscribe}
          hoverColor="hover:bg-primary-hover"
          disabled={isSubmitting}
        />
      </div>
    </Modal>
  );
};

export default SubscribeModal;
