'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import MiniBtn from '@/ui/mini-btn';
import Spinner from '@/ui/spinner';
import { useRouter } from 'next/navigation';
import {
  useIssueBillingKey,
  useGetPaymentAuth,
  useProcessSubscriptionPayment,
  useGetPaymentHistory,
  useGetSubscriptionStatus,
} from '@/hooks';
import useSubscriptionStore from '@/store/subscription-store';

const BillingPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { issueBillingKey, isLoading: isBillingKeyLoading } =
    useIssueBillingKey();
  const { getPaymentAuth, paymentAuth } = useGetPaymentAuth();
  const { processSubscriptionPayment, isLoading: isSubscribing } =
    useProcessSubscriptionPayment();
  const { getPaymentHistory } = useGetPaymentHistory();
  const { getSubscriptionStatus } = useGetSubscriptionStatus();
  const { setSubscription } = useSubscriptionStore();

  const [currentStatus, setCurrentStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [message, setMessage] = useState('');

  const status = searchParams.get('status') || 'loading';
  const urlMessage = searchParams.get('message') || '';
  const authKey = searchParams.get('authKey');
  const customerKey = searchParams.get('customerKey');
  const plan = searchParams.get('plan'); // BASIC | PARTNERS
  const factoryId = useMemo(() => {
    const id = searchParams.get('factoryId');
    return id ? Number(id) : undefined;
  }, [searchParams]);

  const subscriptionId = useMemo(() => {
    if (plan === 'BASIC') return 1;
    if (plan === 'PARTNERS') return 2;
    return null;
  }, [plan]);

  const updateSubscriptionPersist = async (factory: number) => {
    try {
      const res = (await getSubscriptionStatus(factory)) as unknown;
      const resObj =
        res && typeof res === 'object' ? (res as Record<string, unknown>) : {};
      const success = Boolean((resObj.success as boolean | undefined) ?? false);
      const data = resObj.data as
        | {
            subscription_history?: {
              id?: number;
              created_at?: string;
              updated_at?: string;
              start_date?: string;
              end_date?: string;
              is_canceled?: boolean;
              subscription?: { type?: 'basic' | 'partners' | 'trial' };
            };
            is_active?: boolean;
          }
        | undefined;
      if (success && data && data.subscription_history) {
        setSubscription({
          id: data.subscription_history.id ?? null,
          created_at: data.subscription_history.created_at ?? null,
          updated_at: data.subscription_history.updated_at ?? null,
          start_date: data.subscription_history.start_date ?? null,
          end_date: data.subscription_history.end_date ?? null,
          is_canceled: data.subscription_history.is_canceled ?? null,
          type: data.subscription_history.subscription?.type ?? null,
          is_active: data.is_active ?? null,
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const fetchPaymentAuthWithRetry = async (
      factory: number,
      maxAttempts = 5,
      delayMs = 400
    ): Promise<{ billing_key: string; customer_key: string } | null> => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = (await getPaymentAuth(factory)) as unknown;
          const resObj = (
            res && typeof res === 'object'
              ? (res as Record<string, unknown>)
              : {}
          ) as Record<string, unknown>;
          const latestBillingKey =
            (resObj.billing_key as string | undefined) ??
            ((resObj.data as Record<string, unknown> | undefined)
              ?.billing_key as string | undefined) ??
            paymentAuth?.billing_key;
          const latestCustomerKey =
            (resObj.customer_key as string | undefined) ??
            ((resObj.data as Record<string, unknown> | undefined)
              ?.customer_key as string | undefined) ??
            paymentAuth?.customer_key;
          if (latestBillingKey && latestCustomerKey) {
            return {
              billing_key: latestBillingKey,
              customer_key: latestCustomerKey,
            };
          }
        } catch {
          // ignore and retry
        }
        if (attempt < maxAttempts) await wait(delayMs);
      }
      return null;
    };

    const handle = async () => {
      if (status === 'success' && authKey && customerKey && factoryId) {
        try {
          const result = await issueBillingKey(factoryId, {
            auth_key: authKey,
            customer_key: customerKey,
          });
          if (result.success) {
            // 카드 등록 성공 시
            if (subscriptionId) {
              // plan이 있으면 자동 구독 처리
              const creds = await fetchPaymentAuthWithRetry(factoryId);
              if (!creds) {
                setCurrentStatus('error');
                setMessage(
                  '결제 정보를 불러오지 못했습니다. 다시 시도해주세요.'
                );
                return;
              }

              const payResult = (await processSubscriptionPayment({
                factory_id: factoryId,
                subscription_id: subscriptionId,
                billing_key: creds.billing_key,
                customer_key: creds.customer_key,
              })) as { success?: boolean } | unknown;

              if (
                payResult &&
                typeof payResult === 'object' &&
                'success' in payResult &&
                (payResult as { success?: boolean }).success
              ) {
                await Promise.all([
                  getPaymentHistory(factoryId),
                  getSubscriptionStatus(factoryId),
                ]);
                await updateSubscriptionPersist(factoryId); // 구독 정보 localstorage 업데이트
                setCurrentStatus('success');
                setMessage('구독이 시작되었습니다.');
                return;
              } else {
                setCurrentStatus('error');
                setMessage('결제에 실패했습니다. 다시 시도해주세요.');
                return;
              }
            }

            // plan이 없으면 단순 카드 등록 완료
            setCurrentStatus('success');
            setMessage('카드 등록이 완료되었습니다.');
          } else {
            setCurrentStatus('error');
            setMessage(
              result.error || urlMessage || '카드 등록에 실패했습니다.'
            );
          }
        } catch {
          setCurrentStatus('error');
          setMessage(urlMessage || '카드 등록 중 오류가 발생했습니다.');
        }
      } else if (status === 'fail') {
        setCurrentStatus('error');
        setMessage(urlMessage || '카드 등록에 실패했습니다.');
      }
    };
    handle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, authKey, customerKey, factoryId, subscriptionId]);

  const handleConfirm = () => {
    // 구독 설정 페이지로 이동
    router.push('/setting?chip=subscription&register=success');
  };

  const handleRetry = () => {
    // 다시 시도 - 구독 설정 페이지로 이동
    router.push('/setting?chip=subscription');
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full">
      <div className="bg-white rounded-[8px] border-lg p-8 w-full max-w-md">
        {/* 로딩 상태 */}
        {(currentStatus === 'loading' ||
          isBillingKeyLoading ||
          isSubscribing) && (
          <div className="flex-column w-full">
            <div className="w-full h-30 flex justify-center items-center">
              <Spinner />
            </div>
            <h2 className="Heading-2 mt-8 text-center">
              {plan ? '결제 중' : '카드 등록 중'}
            </h2>
          </div>
        )}

        {/* 성공 상태 */}
        {currentStatus === 'success' && (
          <div className="flex-column w-full">
            <div className="w-full flex justify-center">
              <CheckCircle size={120} weight="fill" className="text-primary" />
            </div>
            <h2 className="Heading-2 mt-8 text-center">
              {plan ? '구독이 시작되었어요' : '카드 등록을 완료했어요'}
            </h2>

            {/* 버튼 */}
            <div className="w-full mt-20">
              <MiniBtn
                text="확인"
                bgColor="bg-primary"
                textColor="text-wh"
                hoverColor="hover:bg-primary-hover"
                width="w-full"
                onClick={handleConfirm}
              />
            </div>
          </div>
        )}

        {/* 실패 상태 */}
        {currentStatus === 'error' && (
          <div className="flex-column w-full">
            <div className="w-full flex justify-center">
              <WarningCircle size={120} weight="fill" className="text-yellow" />
            </div>
            <h2 className="Heading-2 mt-8 text-center">
              {plan ? '결제를 실패했어요' : '카드 등록에 실패했어요'}
            </h2>
            {message && (
              <p className="Body-2 mt-4 text-center whitespace-pre-line">
                {message.split('.').map((sentence, index) =>
                  sentence.trim() ? (
                    <span key={index}>
                      {sentence.trim()}
                      {index < message.split('.').length - 1 && '.'}
                      <br />
                    </span>
                  ) : null
                )}
              </p>
            )}

            {/* 버튼 */}
            <div className="w-full mt-10">
              <MiniBtn
                text="다시 시도하기"
                bgColor="bg-primary"
                textColor="text-wh"
                hoverColor="hover:bg-primary-hover"
                width="w-full"
                onClick={handleRetry}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BillingPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
};

export default BillingPage;
