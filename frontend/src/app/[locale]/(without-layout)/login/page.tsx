'use client';

import { useEffect } from 'react';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { validateEmail } from '@/utils/validation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import FactoryXLogo from '@/ui/icons/factory-x-logo';
import { LoginFormDataModel } from '@/types/data-model';
import { useLogin } from '@/hooks/users/use-login';
import useAuthStore from '@/store/auth-store';

const LoginPage = () => {
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  const tFull = useTranslations(); // 전체 경로를 위한 번역 함수
  const router = useRouter();
  const locale = useLocale(); // 현재 locale
  const { login, isLoading } = useLogin();
  const setLoggingOut = useAuthStore((state) => state.setLoggingOut);

  // 로그인 페이지 진입 시 로그아웃 상태 초기화
  useEffect(() => {
    setLoggingOut(false);
  }, [setLoggingOut]);
  // const [showFactorySelectModal, setShowFactorySelectModal] = useState(false);
  // const [factories, _setFactories] = useState<FactoriesResponseModel[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
  } = useForm<LoginFormDataModel>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: LoginFormDataModel) => {
    const result = await login(data);

    if (result.success) {
      // 사용자 언어 설정 확인 및 locale 변경
      if (result.userInfo?.language) {
        // 백엔드 언어 형식을 locale로 변환 (korean -> ko, english -> en)
        const languageMap: Record<string, string> = {
          korean: 'ko',
          english: 'en',
        };
        const userLocale = languageMap[result.userInfo.language] || 'ko';

        // 로그인 성공 후 이동할 경로 결정
        const targetPath =
          result.factoryId && result.role ? '/dashboard' : '/onboarding';

        // 현재 locale과 다르면 locale을 변경하면서 이동
        if (userLocale !== locale) {
          router.replace(targetPath, { locale: userLocale });
          router.refresh();
        } else {
          // locale이 같으면 일반적인 리다이렉트
          router.push(targetPath);
        }
      } else {
        // 언어 정보가 없으면 일반적인 리다이렉트
        if (result.factoryId && result.role) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } else {
      // 로그인 실패
      if (result.field && result.error) {
        setError(result.field, {
          type: 'manual',
          message: result.error,
        });
      }
    }
  };

  const isButtonEnabled =
    isValid && watchedValues.email && watchedValues.password && !isLoading;

  return (
    <>
      <div className="flex min-h-screen">
        <div className="flex-[0.8] bg-primary flex flex-col items-center justify-center">
          <FactoryXLogo width={168.908} height={30.558} color="white" />
        </div>
        <div className="flex flex-col flex-[1.2] gap-5 items-center justify-center w-full">
          <h2 className="Heading-2">{t('title')}</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col w-100"
          >
            <div className="flex flex-col">
              <Input
                type="email"
                placeholder={t('email.placeholder')}
                label={tCommon('email')}
                {...register('email', {
                  required: t('email.required'),
                  validate: (value) => {
                    const error = validateEmail(value, tFull);
                    return error || true;
                  },
                })}
              />
              <div className="mt-1 mb-2 h-5">
                {errors.email && (
                  <span className="text-red Re_Body-1">
                    {errors.email.message}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <Input
                type="password"
                placeholder={t('password.placeholder')}
                label={t('password.label')}
                {...register('password', {
                  required: t('password.required'),
                  validate: (value) => {
                    if (!value) return t('password.required');
                    return true;
                  },
                })}
              />
              <div className="mt-1 mb-2 h-5">
                {errors.password && (
                  <span className="text-red Re_Body-1">
                    {errors.password.message}
                  </span>
                )}
              </div>
            </div>
            <MiniBtn
              text={t('button')}
              bgColor="bg-primary"
              textColor="text-wh"
              hoverColor="hover:bg-primary-hover"
              height="h-12"
              type="submit"
              disabled={!isButtonEnabled}
              width="w-full"
            />
            <div className="flex justify-center items-center Me-Body-1 text-sv gap-5 mt-5">
              <Link href="/signup">{t('signup')}</Link>
              <Link href="/findpassword">{t('findPassword')}</Link>
            </div>
          </form>
        </div>
      </div>

      {/* 
      {showFactorySelectModal && (
        <FactorySelectModal
          factories={factories}
          onClose={() => setShowFactorySelectModal(false)}
        />
      )} */}
    </>
  );
};

export default LoginPage;
