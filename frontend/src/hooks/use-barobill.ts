import { useState } from 'react';
import { BarobillCorpRegisterModel, BarobillCorpCertModel } from '@/types/data-model';

interface BarobillResponse {
  message: string;
  url?: string;
}

interface UseBarobillReturn {
  // 기업 회원가입
  registerCorp: (data: BarobillCorpRegisterModel) => Promise<BarobillResponse>;
  isRegisteringCorp: boolean;
  registerCorpError: string | null;
  
  // 기업 사용자 등록
  addUserToCorp: (data: BarobillCorpRegisterModel) => Promise<BarobillResponse>;
  isAddingUser: boolean;
  addUserError: string | null;
  
  // 기업 인증서 등록 URL 조회
  getCorpCertUrl: (data: BarobillCorpCertModel) => Promise<BarobillResponse>;
  isGettingCertUrl: boolean;
  getCertUrlError: string | null;
  
  // 에러 초기화
  clearErrors: () => void;
}

export const useBarobill = (): UseBarobillReturn => {
  const [isRegisteringCorp, setIsRegisteringCorp] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isGettingCertUrl, setIsGettingCertUrl] = useState(false);
  
  const [registerCorpError, setRegisterCorpError] = useState<string | null>(null);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [getCertUrlError, setGetCertUrlError] = useState<string | null>(null);

  // 에러 초기화
  const clearErrors = () => {
    setRegisterCorpError(null);
    setAddUserError(null);
    setGetCertUrlError(null);
  };

  // 기업 회원가입
  const registerCorp = async (data: BarobillCorpRegisterModel): Promise<BarobillResponse> => {
    setIsRegisteringCorp(true);
    setRegisterCorpError(null);
    
    try {
      const response = await fetch('/v1/barobill/register/corp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access') || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '기업 회원가입에 실패했습니다.');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '기업 회원가입에 실패했습니다.';
      setRegisterCorpError(errorMessage);
      throw error;
    } finally {
      setIsRegisteringCorp(false);
    }
  };

  // 기업 사용자 등록
  const addUserToCorp = async (data: BarobillCorpRegisterModel): Promise<BarobillResponse> => {
    setIsAddingUser(true);
    setAddUserError(null);
    
    try {
      const response = await fetch('/v1/barobill/register/corp/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access') || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '기업 사용자 등록에 실패했습니다.');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '기업 사용자 등록에 실패했습니다.';
      setAddUserError(errorMessage);
      throw error;
    } finally {
      setIsAddingUser(false);
    }
  };

  // 기업 인증서 등록 URL 조회
  const getCorpCertUrl = async (data: BarobillCorpCertModel): Promise<BarobillResponse> => {
    setIsGettingCertUrl(true);
    setGetCertUrlError(null);
    
    try {
      // GET 요청이지만 request body로 데이터 전달
      const response = await fetch('/v1/barobill/register/corp/cert', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access') || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '인증서 등록 URL 조회에 실패했습니다.');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '인증서 등록 URL 조회에 실패했습니다.';
      setGetCertUrlError(errorMessage);
      throw error;
    } finally {
      setIsGettingCertUrl(false);
    }
  };

  return {
    registerCorp,
    isRegisteringCorp,
    registerCorpError,
    
    addUserToCorp,
    isAddingUser,
    addUserError,
    
    getCorpCertUrl,
    isGettingCertUrl,
    getCertUrlError,
    
    clearErrors,
  };
};
