import { useState, useEffect } from 'react';

interface BarobillStatusModel {
  needsRegistration: boolean;
  message: string;
  barobillUserId?: string;
}

export const useBarobillStatus = () => {
  const [status, setStatus] = useState<BarobillStatusModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBarobillStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access') || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회에 실패했습니다.');
      }

      const userData = await response.json();

      if (!userData.barobill_user_id) {
        setStatus({
          needsRegistration: true,
          message:
            '바로빌 회원가입이 필요합니다. 세금계산서 발행을 위해 연동 설정을 진행해주세요.',
        });
      } else {
        setStatus({
          needsRegistration: false,
          message: '바로빌 연동이 완료되었습니다.',
          barobillUserId: userData.barobill_user_id,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '바로빌 상태 확인에 실패했습니다.';
      setError(errorMessage);
      setStatus({
        needsRegistration: true,
        message: '바로빌 상태 확인에 실패했습니다. 연동 설정을 진행해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = () => {
    checkBarobillStatus();
  };

  useEffect(() => {
    checkBarobillStatus();
  }, []);

  return {
    status,
    isLoading,
    error,
    checkBarobillStatus,
    refreshStatus,
  };
};
