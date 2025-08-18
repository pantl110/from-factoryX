import { useState } from 'react';
import {
  BarobillCorpRegisterModel,
  BarobillCorpCertModel,
} from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';

interface BarobillResponseModel {
  message: string;
  url?: string;
}

type BarobillCorpRegisterInputType = Pick<
  BarobillCorpRegisterModel,
  'barobill_id' | 'barobill_password' | 'barobill_password_confirm'
>;
type BarobillCorpCertInputType = Omit<BarobillCorpCertModel, 'factory'>;

interface UseBarobillReturnModel {
  // 기업 회원가입
  registerCorp: (
    data: BarobillCorpRegisterInputType
  ) => Promise<BarobillResponseModel>;
  isRegisteringCorp: boolean;
  registerCorpError: string | null;

  // 기업 사용자 등록
  addUserToCorp: (
    data: BarobillCorpRegisterInputType
  ) => Promise<BarobillResponseModel>;
  isAddingUser: boolean;
  addUserError: string | null;

  // 기업 인증서 등록 URL 조회
  getCorpCertUrl: (
    data: BarobillCorpCertInputType
  ) => Promise<BarobillResponseModel>;
  isGettingCertUrl: boolean;
  getCertUrlError: string | null;

  // 에러 초기화
  clearErrors: () => void;
}

export const useBarobill = (): UseBarobillReturnModel => {
  const factoryId = useFactoryStore((state) => state.factoryId);
  const [isRegisteringCorp, setIsRegisteringCorp] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isGettingCertUrl, setIsGettingCertUrl] = useState(false);

  const [registerCorpError, setRegisterCorpError] = useState<string | null>(
    null
  );
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [getCertUrlError, setGetCertUrlError] = useState<string | null>(null);

  // 에러 초기화
  const clearErrors = () => {
    setRegisterCorpError(null);
    setAddUserError(null);
    setGetCertUrlError(null);
  };

  // 기업 회원가입
  const registerCorp = async (
    data: BarobillCorpRegisterInputType
  ): Promise<BarobillResponseModel> => {
    setIsRegisteringCorp(true);
    setRegisterCorpError(null);

    try {
      if (!factoryId) {
        throw new Error('공장 정보가 없습니다.');
      }
      const payload = {
        factory: String(factoryId),
        barobill_id: data.barobill_id,
        barobill_password: data.barobill_password,
        barobill_password_confirm: data.barobill_password_confirm,
        grade: '2', // 기업 추가 사용자 등록
      } satisfies BarobillCorpRegisterModel;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/barobill/register/corp`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('access') || ''}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '기업 회원가입에 실패했습니다.');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '기업 회원가입에 실패했습니다.';
      setRegisterCorpError(errorMessage);
      throw error;
    } finally {
      setIsRegisteringCorp(false);
    }
  };

  // 기업 사용자 등록
  const addUserToCorp = async (
    data: BarobillCorpRegisterInputType
  ): Promise<BarobillResponseModel> => {
    setIsAddingUser(true);
    setAddUserError(null);

    try {
      if (!factoryId) {
        throw new Error('공장 정보가 없습니다.');
      }
      const payload = {
        factory: String(factoryId),
        barobill_id: data.barobill_id,
        barobill_password: data.barobill_password,
        barobill_password_confirm: data.barobill_password_confirm,
        grade: '2', // 기업 추가 사용자 등록
      } satisfies BarobillCorpRegisterModel;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/barobill/register/corp/user`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('access') || ''}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || '기업 사용자 등록에 실패했습니다.'
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '기업 사용자 등록에 실패했습니다.';
      setAddUserError(errorMessage);
      throw error;
    } finally {
      setIsAddingUser(false);
    }
  };

  // 기업 인증서 등록 URL 조회
  const getCorpCertUrl = async (
    data: BarobillCorpCertInputType
  ): Promise<BarobillResponseModel> => {
    setIsGettingCertUrl(true);
    setGetCertUrlError(null);

    try {
      if (!factoryId) {
        throw new Error('공장 정보가 없습니다.');
      }
      const payload: BarobillCorpCertModel = {
        factory: String(factoryId),
        barobill_id: data.barobill_id,
        barobill_password: data.barobill_password,
      };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/barobill/register/corp/cert`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('access') || ''}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || '인증서 등록 URL 조회에 실패했습니다.'
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '인증서 등록 URL 조회에 실패했습니다.';
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
