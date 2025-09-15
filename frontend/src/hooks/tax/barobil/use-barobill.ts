// 바로빌 관련 훅
// 1. 바로빌 회원 자동등록
// 2. 바로빌 기업 사용자 등록
// 3. 바로빌 기업 인증서 등록
// 4. 바로빌 기업 인증서 등록 여부 확인

import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';

// 타입 정의
export interface BarobillCorpCertInModel {
  barobill_id: string;
  barobill_password: string;
}

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// 1. 바로빌 자동으로 회원가입
// - 대표의 경우 기업 등록 + 기업 사용자 등록
// - 대표가 아닌 경우 담당자 회원으로 등록
export const useBarobillRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const register = useCallback(async () => {
    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/barobill/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ factory: factoryId }),
      });

      if (!response.ok) {
        // API 응답에서 에러 메시지 가져오기
        try {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail ||
            errorData.message ||
            `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        } catch {
          // JSON 파싱 실패 시 기본 에러 메시지 사용
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  return { register, isLoading, error };
};

// 2. 바로빌 기업 인증서 등록 (URL 인증)
export const useBarobillCorpCertUrl = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const getCertUrl = useCallback(
    async (payload: BarobillCorpCertInModel) => {
      if (!factoryId) {
        const errorMessage = '공장 ID가 설정되지 않았습니다.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/v1/barobill/register/corp/cert`,
          {
            method: 'POST', // GET → POST로 변경
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              factory: factoryId,
              barobill_id: payload.barobill_id,
              barobill_password: payload.barobill_password,
            }),
          }
        );

        if (!response.ok) {
          // API 응답에서 에러 메시지 가져오기
          try {
            const errorData = await response.json();
            const errorMessage =
              errorData.detail ||
              errorData.message ||
              `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
          } catch {
            // JSON 파싱 실패 시 기본 에러 메시지 사용
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { getCertUrl, isLoading, error };
};

// 3. 바로빌 기업 인증서 등록 여부 확인
export const useBarobillCertCheck = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const checkCert = useCallback(async () => {
    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/barobill/check/cert/${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        // API 응답에서 에러 메시지 가져오기
        try {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail ||
            errorData.message ||
            `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        } catch {
          // JSON 파싱 실패 시 기본 에러 메시지 사용
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  return { checkCert, isLoading, error };
};
