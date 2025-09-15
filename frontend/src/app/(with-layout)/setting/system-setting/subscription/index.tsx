import { useEffect, useState } from 'react';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import FreePlan from './free-plan';
import PlanItem from './plan-item';
import SubscriptionTableHeader from './subscription-table-header';
import SubscriptionTableItem from './subscription-table-item';
import { PlanType } from './types';
import MiniBtn from '@/ui/mini-btn';
import CardChangeModal from './modals/card-change-modal';
import CardDeleteModal from './modals/card-delete-modal';
import useMemberStore from '@/store/member-store';
import {
  useGetFactory,
  useUpdateFactory,
  useGetSubscriptionStatus,
} from '@/hooks';
import RefundPolicyModal from './modals/refund-policy-modal';

const Subscription = () => {
  const { factoryId } = useMemberStore();
  const { getFactory, factory } = useGetFactory();
  const { getSubscriptionStatus, subscriptionStatus } =
    useGetSubscriptionStatus();
  const { updateFactory } = useUpdateFactory();
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isCardDeleteModalOpen, setIsCardDeleteModalOpen] = useState(false);
  const [isRefundPolicyModalOpen, setIsRefundPolicyModalOpen] = useState(false);

  const planTypes: PlanType[] = ['BASIC', 'PARTNERS'];

  useEffect(() => {
    if (factoryId) {
      getFactory(factoryId);
      getSubscriptionStatus(factoryId);
    }
  }, [factoryId, getFactory, getSubscriptionStatus]);

  const registerCard = async () => {
    try {
      if (!factoryId) {
        alert('공장을 선택해주세요.');
        return;
      }
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        alert('결제 설정이 완료되지 않았습니다. 클라이언트 키가 없습니다.');
        return;
      }
      const toss = await loadTossPayments(clientKey);
      const customerKey = `factory-${factoryId}`; // customerKey는 동일 고객에 대해 항상 동일해야함

      await toss.requestBillingAuth('카드', {
        customerKey,
        successUrl: `${window.location.origin}/billing?status=success`,
        failUrl: `${window.location.origin}/billing?status=fail`,
      });
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: string }).code)
          : undefined;
      // 사용자가 창을 닫거나 결제를 취소한 경우에는 무시
      if (code === 'USER_CANCEL') return;
      alert('카드 등록을 시작하지 못했습니다. 다시 시도해주세요.');
    }

    // ‼️‼️‼️‼️성공하면 빌링키 저장해야 함‼️‼️‼️‼️
  };

  const handleDeleteCard = async () => {
    if (!factoryId || !factory) return;
    try {
      await updateFactory({
        factory_id: factoryId,
        name: factory.name,
        business_registration_number: factory.business_registration_number,
        representative_name: factory.representative_name,
        manager_email: factory.manager_email,
        manager_phone: factory.manager_phone,
        manager_fax: factory.manager_fax,
        business_type: factory.business_type,
        business_category: factory.business_category,
        business_address: factory.business_address,
        is_trial: factory.is_trial,
        billing_key: '',
      });
      await getFactory(factoryId);
    } finally {
      setIsCardDeleteModalOpen(false);
    }

    // ‼️‼️‼️‼️서버에서 카드 삭제 요청도 필요 // 토스 빌링키 해지 api‼️‼️‼️‼️
  };

  return (
    <div className="px-10 pb-10 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h3 className="Heading-3">멤버십 요금제</h3>
        <MiniBtn
          text="환불 및 구독정책"
          variant="whiteOutline"
          onClick={() => setIsRefundPolicyModalOpen(true)}
        />
      </div>
      <div className="flex flex-col gap-2">
        {/* 무료체험 시에만 무료체험 이용중 표시 */}
        {factory?.is_trial && <FreePlan endDate={factory?.trial_end_date} />}
        {planTypes.map((type) => (
          <PlanItem
            key={type}
            type={type}
            registerCard={registerCard}
            subscriptionType={
              subscriptionStatus?.subscription_history.subscription
                .type as PlanType
            }
          />
        ))}
      </div>

      {/* 결제 카드 설정 */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <h3 className="Heading-3">결제 카드 설정</h3>
          <MiniBtn
            text={factory?.billing_key ? '카드 변경 ' : '카드 추가'}
            variant="whiteOutline"
            onClick={
              factory?.billing_key
                ? () => setIsChangeModalOpen(true)
                : registerCard
            }
          />
        </div>

        <div className="flex items-center justify-between h-18 py-4 px-6 border border-lg rounded-xl">
          <h4 className="Heading-4">
            {subscriptionStatus?.current_payment?.card_company}{' '}
            {subscriptionStatus?.current_payment?.card_number}
          </h4>
          <MiniBtn
            text="삭제"
            textColor="text-red"
            bgColor="bg-red-8"
            hoverColor="hover:bg-red-hover"
            onClick={() => setIsCardDeleteModalOpen(true)}
          />
        </div>
      </div>

      {/* 결제 내역 */}
      <div className="flex flex-col gap-4">
        <h3 className="Heading-3">결제 내역</h3>
        <div>
          <SubscriptionTableHeader />
          <SubscriptionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
        </div>
      </div>

      {/* RefundPolicyModal */}
      {isRefundPolicyModalOpen && (
        <RefundPolicyModal onClose={() => setIsRefundPolicyModalOpen(false)} />
      )}

      {/* CardChangeModal */}
      {isChangeModalOpen && (
        <CardChangeModal
          onClose={() => setIsChangeModalOpen(false)}
          onConfirm={() => {
            registerCard();
            setIsChangeModalOpen(false);
          }}
        />
      )}

      {/* CardDeleteModal */}
      {isCardDeleteModalOpen && (
        <CardDeleteModal
          onClose={() => setIsCardDeleteModalOpen(false)}
          onConfirm={handleDeleteCard}
        />
      )}
    </div>
  );
};

export default Subscription;
