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
import useSubscriptionStore from '@/store/subscription-store';
import {
  useGetFactory,
  useGetSubscriptionStatus,
  useGetPaymentHistory,
  useDeleteBillingKey,
  useGetPaymentAuth,
  useProcessSubscriptionPayment,
} from '@/hooks';
import { formatISODate } from '@/utils';
import RefundPolicyModal from './modals/refund-policy-modal';
import NoHistoryBox from '@/ui/no-history-box';
import RegisterCard from './register-card';
import {
  PaymentResponseModel,
  SubscriptionHistoryResponseModel,
} from '@/types/data-model';

const Subscription = () => {
  const { factoryId, role } = useMemberStore();
  const { setSubscription } = useSubscriptionStore();
  const { getFactory, factory } = useGetFactory();
  const { getSubscriptionStatus, subscriptionStatus } =
    useGetSubscriptionStatus();
  const { getPaymentHistory, paymentHistory } = useGetPaymentHistory();
  const { deleteBillingKey } = useDeleteBillingKey();
  const { getPaymentAuth, paymentAuth } = useGetPaymentAuth();
  const { processSubscriptionPayment, isLoading: isSubscribeLoading } =
    useProcessSubscriptionPayment();
  const searchParams = useSearchParams();

  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isCardDeleteModalOpen, setIsCardDeleteModalOpen] = useState(false);
  const [isRefundPolicyModalOpen, setIsRefundPolicyModalOpen] = useState(false);

  const planTypes: PlanType[] = ['BASIC', 'PARTNERS'];
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (factoryId) {
      getFactory(factoryId);
      getSubscriptionStatus(factoryId);
      getPaymentHistory(factoryId);
      getPaymentAuth(factoryId);
    }
  }, [
    factoryId,
    getFactory,
    getSubscriptionStatus,
    getPaymentHistory,
    getPaymentAuth,
  ]);

  // billing success 후 돌아올 때 register=success 플래그가 있으면 PaymentAuth 재조회
  useEffect(() => {
    if (!factoryId) return;
    const register = searchParams.get('register');
    if (register === 'success') {
      getPaymentAuth(factoryId);
    }
  }, [factoryId, searchParams, getPaymentAuth]);

  const refreshSubscriptionData = async () => {
    if (!factoryId) return;
    await Promise.all([
      getFactory(factoryId),
      getPaymentHistory(factoryId),
      getSubscriptionStatus(factoryId),
      getPaymentAuth(factoryId),
    ]);
  };

  // 구독 정보를 persist에 업데이트
  const updateSubscriptionPersist = async () => {
    if (!factoryId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/status/${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const subscriptionData = await response.json();

        if (subscriptionData.subscription_history) {
          setSubscription({
            id: subscriptionData.subscription_history.id ?? null,
            created_at:
              subscriptionData.subscription_history.created_at ?? null,
            updated_at:
              subscriptionData.subscription_history.updated_at ?? null,
            start_date:
              subscriptionData.subscription_history.start_date ?? null,
            end_date: subscriptionData.subscription_history.end_date ?? null,
            is_canceled:
              subscriptionData.subscription_history.is_canceled ?? null,
            type:
              subscriptionData.subscription_history.subscription?.type ?? null,
            is_active: subscriptionData.is_active ?? null,
          });
        }
      }
    } catch {
      // 구독 정보 업데이트 실패 시 무시 (UI에는 영향 없음)
    }
  };

  const handleSubscribe = async (type: PlanType) => {
    // admin이 아니면 권한 없음
    if (!isAdmin) {
      alert('구독 관리는 시스템 관리자만 가능합니다.');
      return;
    }

    // 카드가 없으면 등록 플로우로 이동
    if (!paymentAuth?.billing_key) {
      await registerCard(type);
      return;
    }

    // 카드가 이미 등록된 상태라면 결제/구독 시작
    if (!paymentAuth?.billing_key || !paymentAuth?.customer_key) {
      alert(
        '결제 정보를 불러오지 못했습니다. 화면을 새로고침 후 다시 시도해주세요.'
      );
      return;
    }

    const result = await processSubscriptionPayment({
      factory_id: factoryId ?? undefined,
      subscription_id: type === 'BASIC' ? 1 : 2,
      billing_key: paymentAuth.billing_key,
      customer_key: paymentAuth.customer_key,
    });
    if (result.success) {
      // UI 데이터 새로고침
      await refreshSubscriptionData();
      // persist 구독 정보 업데이트
      await updateSubscriptionPersist();
    }
  };

  const registerCard = async (type?: PlanType) => {
    // admin이 아니면 권한 없음
    if (!isAdmin) {
      alert('카드 관리는 시스템 관리자만 가능합니다.');
      return;
    }

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

      // plan 파라미터 처리 (type이 유효한 문자열일 때만 추가)
      const planParam = type && typeof type === 'string' ? `&plan=${type}` : '';

      // 토스페이먼츠 빌링키 인증 요청 (URL 리다이렉션 방식)
      await toss.requestBillingAuth('카드', {
        customerKey,
        successUrl: `${window.location.origin}/billing?status=success&factoryId=${factoryId}${planParam}`,
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
    // admin이 아니면 권한 없음
    if (!isAdmin) {
      alert('카드 관리는 시스템 관리자만 가능합니다.');
      return;
    }

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

  // 각 플랜별로 예정된 구독이 있는지 확인하는 함수
  const getScheduledSubscriptionForPlan = (planType: PlanType) => {
    if (!subscriptionStatus?.subscription_history.end_date) return false;

    // 현재 구독 종료일의 다음 날 계산
    const currentEndDate = new Date(
      subscriptionStatus.subscription_history.end_date
    );
    const nextDay = new Date(currentEndDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayString = nextDay.toISOString().split('T')[0];

    // 해당 플랜 타입으로 변환
    const subscriptionType =
      planType === 'BASIC'
        ? 'basic'
        : planType === 'PARTNERS'
          ? 'partners'
          : null;

    // 다음 날에 시작하는 해당 플랜 구독이 있는지 확인
    return (
      factory?.subscription_histories.some(
        (history: SubscriptionHistoryResponseModel) => {
          return (
            history.start_date === nextDayString &&
            history.subscription.type === subscriptionType
          );
        }
      ) ?? false
    );
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
        {subscriptionStatus?.subscription_history.subscription.type ===
          'trial' && (
          <FreePlan
            endDate={subscriptionStatus?.subscription_history.end_date}
          />
        )}
        {planTypes.map((type) => (
          <PlanItem
            key={type}
            type={type}
            subscriptionStatus={subscriptionStatus}
            onSubscribe={handleSubscribe}
            isLoading={isSubscribeLoading}
            refreshSubscriptionData={refreshSubscriptionData}
            hasScheduledSubscription={getScheduledSubscriptionForPlan(type)}
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
        {!paymentHistory || paymentHistory?.data.length === 0 ? (
          <NoHistoryBox
            title="결제 내역이 없어요."
            text="결제 시 이곳에 표시돼요."
          />
        ) : (
          <div>
            <SubscriptionTableHeader />
            {paymentHistory?.data.map((payment: PaymentResponseModel) => (
              <SubscriptionTableItem
                key={payment.id}
                date={formatISODate(payment.created_at)}
                card={`${payment.card_company === null ? '-' : payment.card_company} (${payment.card_number === null ? '-' : payment.card_number})`}
                amount={Number(payment.amount).toLocaleString()}
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
