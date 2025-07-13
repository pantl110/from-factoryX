import {
  SendVerificationCodeModel,
  VerifyCodeModel,
  EmailVerificationResponseModel,
} from '@/types/data-model'
import { useState } from 'react'

export const useEmailVerification = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // 이메일 존재 여부 확인 (비밀번호 찾기용)
  const checkEmailExists = async (email: string): Promise<EmailVerificationResponseModel> => {
    setIsChecking(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/send-verification-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            verification_type: 'password_reset',
          }),
        }
      )

      let data
      try {
        data = await response.json()
      } catch {
        data = { message: '서버에서 오류가 발생했습니다.' }
      }

      // 400 상태코드 - 등록되지 않은 이메일
      if (response.status === 400) {
        const errorMessage = data.detail || data.message || ''
        if (errorMessage.includes('등록되지 않은 이메일입니다')) {
          return {
            success: false,
            message: '입력하신 이메일로 가입된 계정이 존재하지 않습니다.',
          }
        }
      }

      if (response.ok) {
        return {
          success: true,
          message: '이메일이 확인되었습니다.',
        }
      }

      // 기타 오류 처리
      const errorMessage = data.message || data.detail || '이메일 확인 중 오류가 발생했습니다.'
      throw new Error(errorMessage)
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '이메일 확인 중 오류가 발생했습니다.',
      }
    } finally {
      setIsChecking(false)
    }
  }

  // 이메일 인증 코드 발송
  const sendVerificationCode = async (
    params: SendVerificationCodeModel
  ): Promise<EmailVerificationResponseModel> => {
    setIsSending(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/send-verification-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: params.email,
            verification_type: params.verification_type,
          }),
        }
      )

      let data
      try {
        data = await response.json()
      } catch {
        data = { message: '서버에서 오류가 발생했습니다.' }
      }

      // 400 상태코드 // 이미 등록된 이메일
      if (response.status === 400) {
        const errorMessage = data.detail || data.message || ''
        if (errorMessage.includes('이미 등록된 이메일입니다')) {
          return {
            success: false,
            message: '이미 가입된 이메일입니다.',
          }
        }
        // 비밀번호 찾기에서 등록되지 않은 이메일 처리
        if (errorMessage.includes('등록되지 않은 이메일입니다')) {
          return {
            success: false,
            message: '입력하신 이메일로 가입된 계정이 존재하지 않습니다.',
          }
        }
      }

      if (response.ok) {
        return {
          success: true,
          message: data.detail || '인증코드가 발송되었습니다.',
          expires_at: data.expires_at,
        }
      }

      // 오류 처리
      const errorMessage = data.message || data.detail || '인증코드 발송 중 오류가 발생했습니다.'
      throw new Error(errorMessage)
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '인증코드 발송 중 오류가 발생했습니다.',
      }
    } finally {
      setIsSending(false)
    }
  }

  const verifyCode = async (params: VerifyCodeModel): Promise<EmailVerificationResponseModel> => {
    setIsChecking(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: params.email,
          code: params.code,
          verification_type: params.verification_type,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch {
        data = { message: '서버에서 오류가 발생했습니다.' }
      }

      if (response.ok) {
        return {
          success: true,
          message: data.detail || '인증이 완료되었습니다.',
        }
      }

      // 오류 처리
      let errorMessage = data.message || data.detail || '인증코드 확인 중 오류가 발생했습니다.'

      // 백엔드 메시지를 프론트엔드 메시지로 매핑
      if (errorMessage.includes('인증 코드가 만료되었습니다.')) {
        errorMessage = '인증 시간이 만료되었습니다. 다시 인증을 요청해 주세요.'
      } else if (errorMessage.includes('유효하지 않은 인증 코드입니다.')) {
        errorMessage = '인증 코드가 일치하지 않습니다.'
      }

      throw new Error(errorMessage)
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '인증코드 확인 중 오류가 발생했습니다.',
      }
    } finally {
      setIsChecking(false)
    }
  }

  return {
    checkEmailExists,
    sendVerificationCode,
    verifyCode,
    isChecking,
    isSending,
  }
}
