import MiniBtn from '@/ui/mini-btn';
import { PlanType, PLAN_INFO } from './types';
import { useState } from 'react';
import { useProcessSubscriptionPayment } from '@/hooks';
import SubscribeModal from './modals/subscribe-modal';

interface PlanItemProps {
  type: PlanType;
  subscriptionType: PlanType;
  registerCard: () => Promise<void> | void;
  paymentAuth?: { billing_key: string; customer_key: string } | null;
}

const PlanItem = ({
  type,
  registerCard,
  subscriptionType,
  paymentAuth,
}: PlanItemProps) => {
  const info = PLAN_INFO[type];
  const isSubscribedType = subscriptionType === type;
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const { processSubscriptionPayment, isLoading } =
    useProcessSubscriptionPayment();

  const handleSubscribe = async () => {
    // 카드가 없으면 등록 플로우로 이동
    if (!paymentAuth?.billing_key) {
      await registerCard();
      return;
    }

    // 카드가 이미 등록된 상태라면 결제/구독 시작
    if (!paymentAuth?.billing_key || !paymentAuth?.customer_key) {
      alert(
        '결제 정보를 불러오지 못했습니다. 화면을 새로고침 후 다시 시도해주세요.'
      );
      return;
    }

    await processSubscriptionPayment({
      subscription_id: type === 'BASIC' ? 1 : 2,
      billing_key: paymentAuth.billing_key,
      customer_key: paymentAuth.customer_key,
    });
    setIsSubscribeModalOpen(false);
  };

  return (
    <>
      <div
        className={`flex flex-col gap-1 py-4 px-6 rounded-xl ${isSubscribedType ? 'bg-primary-8' : 'border border-lg'}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="Heading-3">{info.title}</h3>
          {isSubscribedType ? (
            <MiniBtn
              text="구독 해지"
              variant="transparent"
              onClick={() => {}}
            />
          ) : (
            <MiniBtn
              text="구독"
              variant="primary"
              onClick={() => setIsSubscribeModalOpen(true)}
            />
          )}
        </div>
        <h4 className="Heading-4 text-primary">
          월 {info.price.toLocaleString()}원
        </h4>
        <p className="text-dg Re_Body-1 whitespace-pre-line">
          {info.description}
        </p>
      </div>

      {/* 구독 시작 모달 */}
      {isSubscribeModalOpen && (
        <SubscribeModal
          onSubscribe={handleSubscribe}
          isLoading={isLoading}
          onClose={() => setIsSubscribeModalOpen(false)}
          planTitle={info.title}
        />
      )}
    </>
  );
};

export default PlanItem;
