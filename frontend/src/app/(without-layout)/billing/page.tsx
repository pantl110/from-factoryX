'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import MiniBtn from '@/ui/mini-btn';
import Spinner from '@/ui/spinner';
import { useRouter } from 'next/navigation';
import { useIssueBillingKey } from '@/hooks';

const BillingPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { issueBillingKey, isLoading: isBillingKeyLoading } =
    useIssueBillingKey();
  const [currentStatus, setCurrentStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [message, setMessage] = useState('');

  const status = searchParams.get('status') || 'loading';
  const urlMessage = searchParams.get('message') || '';
  const authKey = searchParams.get('authKey');
  const customerKey = searchParams.get('customerKey');
  const factoryId = useMemo(() => {
    const id = searchParams.get('factoryId');
    return id ? Number(id) : undefined;
  }, [searchParams]);

  useEffect(() => {
    const handle = async () => {
      if (status === 'success' && authKey && customerKey && factoryId) {
        try {
          const result = await issueBillingKey(factoryId, {
            auth_key: authKey,
            customer_key: customerKey,
          });
          if (result.success) {
            setCurrentStatus('success');
            setMessage('카드 등록이 완료되었습니다.');
          } else {
            setCurrentStatus('error');
            setMessage(
              result.error || urlMessage || '카드 등록에 실패했습니다.'
            );
          }
        } catch (_e) {
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
  }, [status, authKey, customerKey, factoryId]);

  const handleConfirm = () => {
    // 구독 설정 페이지로 이동
    router.push('/setting?chip=subscription');
  };

  const handleRetry = () => {
    // 다시 시도 - 구독 설정 페이지로 이동
    router.push('/setting?chip=subscription');
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full">
      <div className="bg-white rounded-[8px] border-lg p-8 w-full max-w-md">
        {/* 로딩 상태 */}
        {(currentStatus === 'loading' || isBillingKeyLoading) && (
          <div className="flex-column w-full">
            <div className="w-full h-30 flex justify-center items-center">
              <Spinner />
            </div>
            <h2 className="Heading-2 mt-8 text-center">카드 등록 중</h2>
          </div>
        )}

        {/* 성공 상태 */}
        {currentStatus === 'success' && (
          <div className="flex-column w-full">
            <div className="w-full flex justify-center">
              <CheckCircle size={120} weight="fill" className="text-primary" />
            </div>
            <h2 className="Heading-2 mt-8 text-center">
              카드 등록을 완료했어요
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
              카드 등록에 실패했어요
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
