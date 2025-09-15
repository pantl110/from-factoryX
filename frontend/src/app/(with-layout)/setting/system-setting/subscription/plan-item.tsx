import MiniBtn from '@/ui/mini-btn';
import { PlanType, PLAN_INFO } from './types';
import { useState } from 'react';
import SubscribeModal from './modals/subscribe-modal';

interface PlanItemProps {
  type: PlanType;
  subscriptionType: PlanType;
  registerCard: () => Promise<void> | void;
}

const PlanItem = ({ type, registerCard, subscriptionType }: PlanItemProps) => {
  const info = PLAN_INFO[type];
  const isSubscribedType = subscriptionType === type;
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  const handleSubscribe = async () => {
    await registerCard();
    // ‼️‼️‼️‼️카드 등록 후 결제/구독 시작까지 추가해야 함‼️‼️‼️‼️
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
            <div className="flex gap-2">
              <MiniBtn text="구독 중" variant="secondary" onClick={() => {}} />
              <MiniBtn
                text="구독 해지"
                variant="transparent"
                onClick={() => {}}
              />
            </div>
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
      {isSubscribeModalOpen && (
        <SubscribeModal
          onClose={() => setIsSubscribeModalOpen(false)}
          planTitle={info.title}
          onSubscribe={handleSubscribe}
        />
      )}
    </>
  );
};

export default PlanItem;
