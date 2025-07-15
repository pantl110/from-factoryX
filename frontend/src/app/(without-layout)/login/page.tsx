'use client'

import Input from '@/ui/input'
import MiniBtn from '@/ui/mini-btn'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { validateEmail } from '@/utils/validation'
import { useRouter } from 'next/navigation'
import FactoryXLogo from '@/ui/icons/factory-x-logo'
import { LoginFormDataModel } from '@/types/data-model'
import { useLogin } from '@/hooks/users/use-login'

const LoginPage = () => {
  const router = useRouter()
  const { login, isLoading } = useLogin()

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
  })

  const watchedValues = watch()

  const onSubmit = async (data: LoginFormDataModel) => {
    const result = await login(data)

    if (result.success) {
      // 로그인 성공
      router.push('/onboarding')
    } else {
      // 로그인 실패
      if (result.field && result.error) {
        setError(result.field, {
          type: 'manual',
          message: result.error,
        })
      }
    }
  }

  const isButtonEnabled = isValid && watchedValues.email && watchedValues.password && !isLoading

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-primary flex flex-col items-center justify-center">
        <FactoryXLogo width={168.908} height={30.558} color="white" />
      </div>
      <div className="flex flex-col flex-1 gap-5 items-center justify-center w-full">
        <h2 className="Heading-2">로그인</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col w-100">
          <div className="flex flex-col">
            <Input
              type="email"
              placeholder="이메일을 입력해주세요."
              label="이메일"
              {...register('email', {
                required: '이메일을 입력해주세요.',
                validate: (value) => {
                  const error = validateEmail(value)
                  return error || true
                },
              })}
            />
            <div className="mt-1 mb-2 h-5">
              {errors.email && <span className="text-red Re_Body-1">{errors.email.message}</span>}
            </div>
          </div>
          <div className="flex flex-col">
            <Input
              type="password"
              placeholder="비밀번호를 입력해주세요."
              label="비밀번호"
              {...register('password', {
                required: '비밀번호를 입력해주세요.',
                validate: (value) => {
                  if (!value) return '비밀번호를 입력해주세요.'
                  return true
                },
              })}
            />
            <div className="mt-1 mb-2 h-5">
              {errors.password && (
                <span className="text-red Re_Body-1">{errors.password.message}</span>
              )}
            </div>
          </div>
          <MiniBtn
            text="로그인"
            bgColor="bg-primary"
            textColor="text-wh"
            hoverColor="hover:bg-primary-hover"
            height="h-12"
            type="submit"
            disabled={!isButtonEnabled}
            width="w-full"
          />
          <div className="flex justify-center items-center Me-Body-1 text-sv gap-5 mt-5">
            <Link href="/signup">회원가입</Link>
            <Link href="/findpassword">비밀번호 찾기</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
