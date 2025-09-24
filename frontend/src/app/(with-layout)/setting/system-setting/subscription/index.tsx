import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  useGetSubscriptionStatus,
  useGetPaymentHistory,
  useDeleteBillingKey,
  useGetPaymentAuth,
} from '@/hooks';
import RefundPolicyModal from './modals/refund-policy-modal';
import NoHistoryBox from '@/ui/no-history-box';
import RegisterCard from './register-card';

const Subscription = () => {
  const { factoryId } = useMemberStore();
  const { getFactory, factory } = useGetFactory();
  const { getSubscriptionStatus, subscriptionStatus } =
    useGetSubscriptionStatus();
  const { getPaymentHistory, paymentHistory } = useGetPaymentHistory();
  const { deleteBillingKey } = useDeleteBillingKey();
  const { getPaymentAuth, paymentAuth } = useGetPaymentAuth();
  const searchParams = useSearchParams();

  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isCardDeleteModalOpen, setIsCardDeleteModalOpen] = useState(false);
  const [isRefundPolicyModalOpen, setIsRefundPolicyModalOpen] = useState(false);

  const planTypes: PlanType[] = ['BASIC', 'PARTNERS'];

  useEffect(() => {
    if (factoryId) {
      getFactory(factoryId);
      getSubscriptionStatus(factoryId);
      getPaymentHistory(factoryId);
      getPaymentAuth(factoryId);
    }
  }, [factoryId, getFactory, getSubscriptionStatus, getPaymentHistory]);

  // billing success 후 돌아올 때 register=success 플래그가 있으면 PaymentAuth 재조회
  useEffect(() => {
    if (!factoryId) return;
    const register = searchParams.get('register');
    if (register === 'success') {
      getPaymentAuth(factoryId);
    }
  }, [factoryId, searchParams, getPaymentAuth]);

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

      // 토스페이먼츠 빌링키 인증 요청 (URL 리다이렉션 방식)
      await toss.requestBillingAuth('카드', {
        customerKey,
        successUrl: `${window.location.origin}/billing?status=success&factoryId=${factoryId}`,
        failUrl: `${window.location.origin}/billing?status=fail&factoryId=${factoryId}`,
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
  };

  const handleDeleteCard = async () => {
    if (!factoryId) return;
    try {
      const result = await deleteBillingKey();
      if (!result.success) {
        alert(result.error ?? '카드 삭제에 실패했습니다.');
        return;
      }
      await Promise.all([getPaymentAuth(factoryId)]);
    } finally {
      setIsCardDeleteModalOpen(false);
    }
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
      <RegisterCard
        paymentAuth={paymentAuth ?? null}
        registerCard={registerCard}
        setIsChangeModalOpen={setIsChangeModalOpen}
        setIsCardDeleteModalOpen={setIsCardDeleteModalOpen}
      />

      {/* 결제 내역 */}
      <div className="flex flex-col gap-4">
        <h3 className="Heading-3">결제 내역</h3>
        {paymentHistory?.data.length === 0 ? (
          <NoHistoryBox
            title="결제 내역이 없어요."
            text="결제 시 이곳에 표시돼요."
          />
        ) : (
          <div>
            <SubscriptionTableHeader />
            {paymentHistory?.data.map((payment) => (
              <SubscriptionTableItem
                key={payment.id}
                date={payment.created_at}
                card={`${payment.card_company} (${payment.card_number})`}
                amount={payment.amount.toLocaleString()}
                plan={
                  payment.subscription_history.subscription.type === 'basic'
                    ? 'Basic'
                    : payment.subscription_history.subscription.type ===
                        'partners'
                      ? 'Partners'
                      : '-'
                }
              />
            ))}
          </div>
        )}
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
