import MiniBtn from '@/ui/mini-btn';
import { PlanType, PLAN_INFO } from './types';
import { useState } from 'react';
import SubscribeModal from './modals/subscribe-modal';

interface PlanItemProps {
  type: PlanType;
  subscriptionType: PlanType;
  onSubscribe: (type: PlanType, onClose?: () => void) => Promise<void>;
  isLoading: boolean;
}

const PlanItem = ({
  type,
  subscriptionType,
  onSubscribe,
  isLoading,
}: PlanItemProps) => {
  const info = PLAN_INFO[type];
  const isSubscribedType = subscriptionType === type;
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  const handleSubscribe = async () => {
    await onSubscribe(type, () => setIsSubscribeModalOpen(false));
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
