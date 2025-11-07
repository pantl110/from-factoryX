import MiniBtn from '@/ui/mini-btn';
import { PlanType, PLAN_INFO } from './types';
import { useState } from 'react';
import SubscribeModal from './modals/subscribe-modal';
import {
  useCancelScheduledSubscription,
  useCancelSubscriptionPayment,
} from '@/hooks';
import { SubscriptionStatusResponseModel } from '@/types/data-model';
import CancelSubscriptionModal from './modals/cancel-subscription-modal';
import useMemberStore from '@/store/member-store';

interface PlanItemProps {
  type: PlanType;
  subscriptionStatus: SubscriptionStatusResponseModel | null;
  onSubscribe: (type: PlanType, onClose?: () => void) => Promise<void>;
  isLoading: boolean;
  refreshSubscriptionData: () => void;
  hasScheduledSubscription: boolean;
}

const PlanItem = ({
  type,
  subscriptionStatus,
  onSubscribe,
  isLoading,
  refreshSubscriptionData,
  hasScheduledSubscription,
}: PlanItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isAdmin = role === 'admin';

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
  const isTrial =
    subscriptionStatus?.subscription_history.subscription.type === 'trial';

  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] =
    useState(false);

  const { cancelSubscriptionPayment, isLoading: isCancelLoading } =
    useCancelSubscriptionPayment();
  const { cancelScheduledSubscription, isLoading: isCancelScheduledLoading } =
    useCancelScheduledSubscription();

  const handleSubscribe = async () => {
    await onSubscribe(type);
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
      refreshSubscriptionData();
    } else {
      alert(res.error ?? '구독 해지에 실패했습니다.');
    }
  };

  const handleCancelScheduledSubscription = async () => {
    if (!hasScheduledSubscription) return;

    const res = await cancelScheduledSubscription();
    if (res.success) {
      refreshSubscriptionData();
    } else {
      alert(res.error ?? '예정된 구독 취소에 실패했습니다.');
    }
  };

  return (
    <>
      <div
        className={`flex flex-col gap-1 py-4 px-6 rounded-xl ${isSubscribedType ? 'bg-primary-8' : 'border border-lg'}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="Heading-3">{info.title}</h3>
          {hasScheduledSubscription ? (
            // hasScheduledSubscription이 true일 때
            isSubscribedType ? null : ( // isSubscribedType이면 null (버튼 없음)
              // isSubscribedType이 아니면 구독 예정
              <MiniBtn
                text="구독 예정 취소"
                variant="red"
                onClick={handleCancelScheduledSubscription}
                disabled={!isAdmin || isCancelScheduledLoading}
              />
            )
          ) : // hasScheduledSubscription이 false일 때
          isSubscribedType ? (
            // isSubscribedType이면 구독해지나 해지 취소 버튼
            subscriptionStatus?.subscription_history.is_canceled === true ? (
              <MiniBtn
                text="해지 취소"
                variant="red"
                onClick={handleSubscribe}
                disabled={!isAdmin}
              />
            ) : (
              <MiniBtn
                text="구독 해지"
                variant="secondary"
                onClick={() => setIsCancelSubscriptionModalOpen(true)}
                disabled={!isAdmin}
              />
            )
          ) : (
            // isSubscribedType이 아니면 구독 버튼
            <MiniBtn
              text="구독"
              variant="primary"
              onClick={() => setIsSubscribeModalOpen(true)}
              disabled={!isAdmin}
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
          isTrial={isTrial}
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
