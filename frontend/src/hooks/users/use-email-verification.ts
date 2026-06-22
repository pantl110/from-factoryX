'use client';

import {
  SendVerificationCodeModel,
  VerifyCodeModel,
  EmailVerificationResponseModel,
} from '@/types/data-model';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export const useEmailVerification = () => {
  const t = useTranslations('emailVerification');
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 이메일 존재 여부 확인 (비밀번호 찾기용)
  const checkEmailExists = async (
    email: string
  ): Promise<EmailVerificationResponseModel> => {
    setIsChecking(true);

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
      );

      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: t('serverError') };
      }

      // 400 상태코드 - 등록되지 않은 이메일
      if (response.status === 400) {
        const errorMessage = data.detail || data.message || '';
        if (errorMessage.includes('등록되지 않은 이메일입니다')) {
          return {
            success: false,
            message: t('emailNotRegistered'),
          };
        }
      }

      if (response.ok) {
        return {
          success: true,
          message: t('emailVerified'),
        };
      }

      // 기타 오류 처리
      const errorMessage = data.message || data.detail || t('emailCheckError');
      throw new Error(errorMessage);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : t('emailCheckError'),
      };
    } finally {
      setIsChecking(false);
    }
  };

  // 이메일 인증 코드 발송
  const sendVerificationCode = async (
    params: SendVerificationCodeModel
  ): Promise<EmailVerificationResponseModel> => {
    setIsSending(true);

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
      );

      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: t('serverError') };
      }

      // 400 상태코드 // 이미 등록된 이메일
      if (response.status === 400) {
        const errorMessage = data.detail || data.message || '';
        if (errorMessage.includes('이미 등록된 이메일입니다')) {
          return {
            success: false,
            message: t('emailAlreadyRegistered'),
          };
        }
        // 비밀번호 찾기에서 등록되지 않은 이메일 처리
        if (errorMessage.includes('등록되지 않은 이메일입니다')) {
          return {
            success: false,
            message: t('emailNotRegistered'),
          };
        }
      }

      if (response.ok) {
        return {
          success: true,
          message: data.detail || t('codeSent'),
          expires_at: data.expires_at,
        };
      }

      // 오류 처리
      const errorMessage = data.message || data.detail || t('codeSendError');
      throw new Error(errorMessage);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : t('codeSendError'),
      };
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async (
    params: VerifyCodeModel
  ): Promise<EmailVerificationResponseModel> => {
    setIsChecking(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/verify-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: params.email,
            code: params.code,
            verification_type: params.verification_type,
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: t('serverError') };
      }

      if (response.ok) {
        return {
          success: true,
          message: data.detail || t('verificationComplete'),
        };
      }

      // 오류 처리
      let errorMessage = data.message || data.detail || t('codeVerifyError');

      // 백엔드 메시지(한국어)를 프론트엔드 번역 메시지로 매핑
      // NOTE: includes() 비교 문자열은 백엔드 응답 한국어에 의존한다.
      // 백엔드가 에러 코드를 제공하면 코드 기반 분기로 교체해야 한다.
      if (errorMessage.includes('인증 코드가 만료되었습니다.')) {
        errorMessage = t('codeExpired');
      } else if (errorMessage.includes('유효하지 않은 인증 코드입니다.')) {
        errorMessage = t('codeMismatch');
      }

      throw new Error(errorMessage);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : t('codeVerifyError'),
      };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkEmailExists,
    sendVerificationCode,
    verifyCode,
    isChecking,
    isSending,
  };
};
