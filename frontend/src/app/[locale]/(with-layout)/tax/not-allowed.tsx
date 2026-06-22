import { Lock } from '@phosphor-icons/react';
import MiniBtn from '@/ui/mini-btn';
import { useRouter } from '@/i18n/navigation';
import useMemberStore from '@/store/member-store';
import { useTranslations } from 'next-intl';

const NotAllowed = () => {
  const router = useRouter();
  const factoryId = useMemberStore((state) => state.factoryId);
  const t = useTranslations('tax.notAllowed');
  return (
    <div className="flex justify-center items-center z-10 w-[calc(100vw-256px)] h-[calc(100vh-60px)] fixed top-15 left-64 bg-white/50 backdrop-blur-lg">
      <div className="z-12 bg-wh w-[600px] flex flex-col gap-4 p-6 rounded-[8px] border border-lg items-center">
        <div className="flex items-center justify-center rounded-full w-11 h-11 bg-bg">
          <Lock size={24} className="text-primary" />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="Heading-3">{t('title')}</h3>
          <p className="text-gr text-center whitespace-pre-line">
            {factoryId ? t('messageWithFactory') : t('messageWithoutFactory')}
          </p>
        </div>

        <div className="flex gap-2.5 w-full justify-end">
          <MiniBtn
            text={t('backToDashboard')}
            variant={factoryId ? 'gray' : 'primary'}
            onClick={() => {
              router.push('/dashboard');
            }}
          />
          {factoryId && (
            <MiniBtn
              text={t('viewDetails')}
              variant="secondary"
              onClick={() => {
                router.push('/setting?chip=subscription');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotAllowed;
