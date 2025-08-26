import { Lock } from '@phosphor-icons/react';
import MiniBtn from '@/ui/mini-btn';
import { useRouter } from 'next/navigation';
import useMemberStore from '@/store/member-store';

const NotAllowed = () => {
  const router = useRouter();
  const factoryId = useMemberStore((state) => state.factoryId);
  return (
    <div className="flex justify-center items-center z-50 w-[calc(100vw-256px)] h-[calc(100vh-60px)] fixed top-15 left-64 bg-white/50 backdrop-blur-lg">
      <div className="z-52 bg-wh w-[600px] flex flex-col gap-4 p-6 rounded-[8px] border border-lg items-center">
        <div className="flex items-center justify-center rounded-full w-11 h-11 bg-bg">
          <Lock size={24} className="text-primary" />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="Heading-3">
            {factoryId
              ? '무료 플랜에서는 세무/회계 기능이 잠겨있어요.'
              : '세무/회계 기능이 잠겨있어요.'}
          </h3>
          <p className="text-gr text-center whitespace-pre-line">
            {factoryId
              ? `Basic 또는 Partners 플랜으로 업그레이드하면\n세무/회계 기능을 사용할 수 있어요.`
              : `실제 공장을 생성하거나 초대받아\n운영자 권한으로 접속해야 사용할 수 있어요`}
          </p>
        </div>

        <div className="flex gap-2.5 w-full justify-end">
          {factoryId ? (
            <>
              <MiniBtn
                text="대시보드로 돌아가기"
                textColor="text-sv"
                hoverColor="hover:bg-bg"
                onClick={() => {
                  router.push('/dashboard');
                }}
              />
              <MiniBtn
                text="자세히 보기"
                textColor="text-wh"
                bgColor="bg-primary"
                hoverColor="hover:bg-primary-hover"
                onClick={() => {
                  router.push('/setting?tab=subscription');
                }}
              />
            </>
          ) : (
            <MiniBtn
              text="대시보드로 돌아가기"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
              onClick={() => {
                router.push('/dashboard');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotAllowed;
