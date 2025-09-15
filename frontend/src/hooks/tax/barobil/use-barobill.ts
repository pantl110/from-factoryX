// 바로빌 관련 훅
// 1. 바로빌 회원 자동등록
// 2. 바로빌 기업 사용자 등록
// 3. 바로빌 기업 인증서 등록
// 4. 바로빌 기업 인증서 등록 여부 확인

import { useState, useCallback } from 'react';
import axios from 'axios';
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
      const response = await axios.post(
        `${API_BASE_URL}/v1/barobill/register`,
        { factory: factoryId },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (err) {
      let errorMessage = '알 수 없는 오류가 발생했습니다.';

      if (axios.isAxiosError(err)) {
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
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
        const response = await axios.post(
          `${API_BASE_URL}/v1/barobill/register/corp/cert`,
          {
            factory: factoryId,
            barobill_id: payload.barobill_id,
            barobill_password: payload.barobill_password,
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        return response.data;
      } catch (err) {
        let errorMessage = '알 수 없는 오류가 발생했습니다.';

        if (axios.isAxiosError(err)) {
          if (err.response?.data?.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
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
      const response = await axios.get(
        `${API_BASE_URL}/v1/barobill/check/cert/${factoryId}`,
        {
          withCredentials: true,
        }
      );

      return response.data;
    } catch (err) {
      let errorMessage = '알 수 없는 오류가 발생했습니다.';

      if (axios.isAxiosError(err)) {
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  return { checkCert, isLoading, error };
};
