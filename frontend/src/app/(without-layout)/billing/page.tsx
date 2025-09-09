'use client';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import MiniBtn from '@/ui/mini-btn';
import Spinner from '@/ui/spinner';
import { useRouter } from 'next/navigation';

const BillingPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status') || 'loading';
  const billingKey = searchParams.get('billingKey');
  const customerKey = searchParams.get('customerKey');
  //   const amount = searchParams.get('amount');
  //   const orderId = searchParams.get('orderId');
  //   const paymentKey = searchParams.get('paymentKey');
  //   const errorCode = searchParams.get('code');
  //   const errorMessage = searchParams.get('message');
  const amount = '10000';
  const orderId = '1234567890';
  const errorCode = '1234567890';
  const errorMessage = '1234567890';

  const handleConfirm = () => {
    // 구독 설정 페이지로 이동
    router.push('/setting?tab=subscription');
  };

  const handleRetry = () => {
    // 다시 시도 - 구독 설정 페이지로 이동
    router.push('/setting?tab=subscription');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-[8px] border-lg p-8 w-full max-w-md">
        {/* 로딩 상태 */}
        {status === 'loading' && (
          <div className="flex-column align-center w-full">
            <div className="w-30 h-30 flex justify-center items-center">
              <Spinner />
            </div>
            <h2 className="Heading-2 mt-8">결제 진행 중</h2>
          </div>
        )}

        {/* 성공 상태 */}
        {status === 'success' && (
          <div className="flex-column align-center w-full">
            <CheckCircle size={120} weight="fill" className="text-primary" />
            <h2 className="Heading-2 mt-8">결제를 완료했어요</h2>

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
        {status === 'fail' && (
          <div className="flex-column align-center w-full">
            <WarningCircle size={120} weight="fill" className="text-yellow" />
            <h2 className="Heading-2 mt-8">결제를 실패했어요</h2>

            {/* 버튼 */}
            <div className="w-full mt-20">
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

export default BillingPage;
