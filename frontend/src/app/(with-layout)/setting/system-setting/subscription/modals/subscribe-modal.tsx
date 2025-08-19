'use client';

import { useState } from 'react';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import useAuthStore from '@/store/auth-store';

interface SubscribeModalProps {
  onClose: () => void;
  planTitle: string;
}

const SubscribeModal = ({ onClose, planTitle }: SubscribeModalProps) => {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const { userInfo } = useAuthStore();

  const handlePayment = async () => {
    if (!userInfo) {
      alert('사용자 정보를 가져올 수 없습니다.');
      return;
    }

    setIsPaymentLoading(true);

    try {
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ''
      );

      // 구독 플랜에 따른 금액 설정 (실제로는 props로 받거나 API에서 가져와야 함)
      const amount = planTitle === 'Partners' ? 110000 : 5900; // 가격 설정 필요

      await tossPayments.requestPayment('카드', {
        amount: amount,
        orderId: `sub_${Date.now()}`, // 실제로는 서버에서 생성해야 함
        orderName: `${planTitle} 플랜 구독`,
        customerName: userInfo.username || '사용자',
        customerEmail: userInfo.email,
        successUrl: `${window.location.origin}/setting?tab=subscription`,
        failUrl: `${window.location.origin}/setting?tab=subscription`,
      });
    } catch (error) {
      // 사용자가 결제창을 취소한 경우는 에러 메시지 표시하지 않음
      if (error instanceof Error && error.message.includes('취소되었습니다')) {
        // 취소된 경우 아무 일도 하지 않음
      } else {
        // 다른 에러의 경우에만 알림 표시
        alert('결제 요청에 실패했습니다.');
      }
    } finally {
      setIsPaymentLoading(false);
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
          hoverColor=""
        />
        <MiniBtn
          text="결제하기"
          bgColor="bg-primary"
          textColor="text-wh"
          onClick={handlePayment}
          hoverColor="hover:bg-primary-hover"
          disabled={isPaymentLoading}
        />
      </div>
    </Modal>
  );
};

export default SubscribeModal;
