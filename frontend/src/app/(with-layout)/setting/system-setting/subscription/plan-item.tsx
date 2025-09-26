import MiniBtn from '@/ui/mini-btn';
import { PlanType, PLAN_INFO } from './types';
import { useState } from 'react';
import SubscribeModal from './modals/subscribe-modal';
import { useCancelSubscriptionPayment } from '@/hooks/subscription/use-cancel-subscription-payment';
import { SubscriptionStatusResponseModel } from '@/types/data-model';
import CancelSubscriptionModal from './modals/cancel-subscription-modal';

interface PlanItemProps {
  type: PlanType;
  subscriptionStatus: SubscriptionStatusResponseModel | null;
  onSubscribe: (type: PlanType, onClose?: () => void) => Promise<void>;
  isLoading: boolean;
  onCanceled: () => void;
}

const PlanItem = ({
  type,
  subscriptionStatus,
  onSubscribe,
  isLoading,
  onCanceled,
}: PlanItemProps) => {
  const info = PLAN_INFO[type];
  const subscriptionType =
    subscriptionStatus?.is_active === true &&
    subscriptionStatus?.subscription_history.subscription.type === 'basic'
      ? 'BASIC'
      : subscriptionStatus?.is_active === true &&
          subscriptionStatus?.subscription_history.subscription.type ===
            'partners'
        ? 'PARTNERS'
        : null;
  const isSubscribedType = subscriptionType === type;

  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] =
    useState(false);

  const { cancelSubscriptionPayment, isLoading: isCancelLoading } =
    useCancelSubscriptionPayment();

  const handleSubscribe = async () => {
    await onSubscribe(type, () => setIsSubscribeModalOpen(false));
  };

  const handleCancel = async () => {
    if (!isSubscribedType) return;
    if (!subscriptionStatus?.current_payment?.id) {
      alert('취소할 결제를 찾을 수 없습니다.');
      return;
    }
    const res = await cancelSubscriptionPayment(
      subscriptionStatus?.current_payment?.id,
      {
        cancel_reason: '구독 해지',
      }
    );
    if (res.success) {
      setIsCancelSubscriptionModalOpen(false);
      onCanceled?.();
    } else {
      alert(res.error ?? '구독 해지에 실패했습니다.');
    }
  };

  return (
    <>
      <div
        className={`flex flex-col gap-1 py-4 px-6 rounded-xl ${isSubscribedType ? 'bg-primary-8' : 'border border-lg'}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="Heading-3">{info.title}</h3>
          {isSubscribedType ? (
            subscriptionStatus?.subscription_history.is_canceled === true ? (
              <MiniBtn
                text="해지 취소"
                variant="red"
                onClick={handleSubscribe}
              />
            ) : (
              <MiniBtn
                text="구독 해지"
                variant="secondary"
                onClick={() => setIsCancelSubscriptionModalOpen(true)}
              />
            )
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
          endDate={subscriptionStatus?.subscription_history.end_date ?? ''}
        />
      )}
      {/* 구독 해지 모달 */}
      {isCancelSubscriptionModalOpen && (
        <CancelSubscriptionModal
          onCancel={handleCancel}
          isLoading={isCancelLoading}
          onClose={() => setIsCancelSubscriptionModalOpen(false)}
          planTitle={info.title}
        />
      )}
    </>
  );
};

export default PlanItem;
