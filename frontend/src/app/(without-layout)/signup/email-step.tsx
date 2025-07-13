'use client'

import Input from '@/ui/input'
import MiniBtn from '@/ui/mini-btn'
import { UseFormRegister, FieldErrors, UseFormSetError } from 'react-hook-form'
import { SignupFormDataModel } from '@/types/data-model'
import { validateEmail } from '@/utils/validation'
import { useEmailVerification } from '@/hooks/users/use-email-verification'
import { useState } from 'react'

interface EmailStepProps {
  register: UseFormRegister<SignupFormDataModel>
  errors: FieldErrors<SignupFormDataModel>
  setError: UseFormSetError<SignupFormDataModel>
  watchedValues: SignupFormDataModel
  verificationCode: string
  setVerificationCode: (value: string) => void
  verification: {
    isVerificationSent: boolean
    timeLeft: number
    formatTime: (seconds: number) => string
    handleResetTimer: () => void
    startVerification: () => void
    completeVerification: () => void
  }
  isRequiredTermsChecked: boolean
  handleSignup: () => void
  handleVerificationComplete: () => void
}

const EmailStep = ({
  register,
  errors,
  setError,
  watchedValues,
  verificationCode,
  setVerificationCode,
  verification,
  isRequiredTermsChecked,
  handleSignup,
  handleVerificationComplete,
}: EmailStepProps) => {
  const { sendVerificationCode, verifyCode, isSending, isChecking } = useEmailVerification()
  const [verificationError, setVerificationError] = useState<string>('')

  const handleSendVerificationCode = async () => {
    if (!watchedValues.email || errors.email) return

    // 이메일 인증 코드 발송
    const result = await sendVerificationCode({
      email: watchedValues.email,
      verification_type: 'signup',
    })

    if (!result.success) {
      // 이메일 중복 또는 기타 오류 처리
      setError('email', {
        type: 'manual',
        message: result.message || '이메일 인증 코드 발송에 실패했습니다.',
      })
      return
    }

    // 인증 코드 발송 성공 시 타이머 시작
    verification.handleResetTimer()
    verification.startVerification()
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6 || isChecking) return

    // 시간이 만료된 경우 우선적으로 만료 메시지 표시
    if (verification.timeLeft <= 0) {
      setVerificationError('인증 시간이 만료되었습니다. 다시 인증을 요청해 주세요.')
      return
    }

    const result = await verifyCode({
      email: watchedValues.email,
      code: verificationCode,
      verification_type: 'signup',
    })

    if (result.success) {
      verification.completeVerification()
      handleVerificationComplete() // 인증 완료 시 호출
    } else {
      setVerificationError(result.message || '')
    }
  }

  return (
    <>
      <div className="flex flex-col">
        <Input
          type="email"
          placeholder="이메일을 입력해주세요."
          label="이메일"
          disabled={verification.isVerificationSent}
          {...register('email', {
            required: '이메일을 입력해주세요.',
            validate: (value) => {
              const error = validateEmail(value)
              return error || true // error 시 // 이메일을 입력해주세요. // "이메일 형식이 올바르지 않습니다."
            },
          })}
        />
        <div className="mt-1 mb-2 h-5">
          {errors.email && <span className="text-red Re_Body-1">{errors.email.message}</span>}
        </div>
      </div>
      {verification.isVerificationSent && (
        <div className="flex flex-col">
          <Input
            type="number"
            placeholder="이메일로 전송된 6자리 인증 코드를 입력해주세요."
            label="인증 코드"
            value={verificationCode}
            onChange={(e) => {
              setVerificationCode(e.target.value.slice(0, 6))
              setVerificationError('') // 입력 시 오류 메시지 초기화
            }}
          />
          <div className="mt-2 mb-6 h-5 flex justify-between items-center">
            <div className="flex gap-2">
              <span className="text-dg Re_Body-1 w-8">
                {verification.formatTime(verification.timeLeft)}
              </span>
              {verificationError && <span className="text-red Re_Body-1">{verificationError}</span>}
            </div>
            <button
              type="button"
              onClick={() => {
                handleSendVerificationCode()
                handleSignup()
              }}
              className={`w-10.5 items-end Re_Body-1 underline ${
                verification.timeLeft > 0 ? 'text-lg pointer-events-none' : 'text-sv'
              }`}
              disabled={verification.timeLeft > 0}
            >
              재전송
            </button>
          </div>
        </div>
      )}
      <MiniBtn
        width="w-full"
        text={verification.isVerificationSent ? '인증 완료' : '이메일 인증'}
        bgColor="bg-primary"
        textColor="text-wh"
        hoverColor="hover:bg-primary-hover"
        height="h-12"
        type="button"
        onClick={verification.isVerificationSent ? handleVerifyCode : handleSendVerificationCode}
        disabled={
          verification.isVerificationSent
            ? !verificationCode || verificationCode.length !== 6 || isChecking
            : !watchedValues.email || !!errors.email || !isRequiredTermsChecked || isSending // 로딩 중에는 버튼 비활성화
        }
      />
    </>
  )
}

export default EmailStep
