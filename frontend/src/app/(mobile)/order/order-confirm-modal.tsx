import React from 'react';
import MoModal from '@/ui/modal/mo-modal';
import Image from 'next/image';
import MoBtn from '@/ui/mo-btn';

interface OrderConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const OrderConfirmModal = ({ onClose, onConfirm }: OrderConfirmModalProps) => {
  return (
    <MoModal title="주문 내역 확정" onClose={onClose}>
      <div className="flex flex-col gap-3 mb-4 ">
        <div className="flex justify-center mb-3">
          <Image
            src="/order-confirm.png"
            alt="주문 내역 확정"
            width={80}
            height={80}
          />
        </div>
        <p className="m-Body-3 text-sv">
          PC에서 이메일 발송과 계산서 발행이 가능해요.
        </p>
        <p className="m-Body-3 text-sv">
          또한, 주문확정서로 고객이 내용을 확인할 수 있어 주문 내역을 더욱
          명확하게 전달 할 수 있어요!
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <MoBtn
          text="확정하기"
          variant="primary"
          width="w-full"
          big={true}
          onClick={onConfirm}
        />
        <MoBtn
          text="닫기"
          variant="outline"
          width="w-full"
          big={true}
          onClick={onClose}
        />
      </div>
    </MoModal>
  );
};

export default OrderConfirmModal;
