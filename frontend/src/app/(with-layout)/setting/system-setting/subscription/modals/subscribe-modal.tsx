'use client';

import { useState } from 'react';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface SubscribeModalProps {
  onClose: () => void;
  planTitle: string;
  onSubscribe: () => Promise<void> | void;
  isLoading: boolean;
}

const SubscribeModal = ({
  onClose,
  planTitle,
  onSubscribe,
  isLoading,
}: SubscribeModalProps) => {
  return (
    <Modal
      title={`${planTitle} 플랜을 구독하시겠어요?`}
      subtitle={
        planTitle === 'Basic'
          ? `기본적인 기능을 이용할 수 있어요.`
          : `세무/회계 기능까지 모두 이용할 수 있어요.`
      }
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="취소" variant="white" onClick={onClose} />
        <MiniBtn
          text="구독하기"
          variant="primary"
          onClick={onSubscribe}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default SubscribeModal;
