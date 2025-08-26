import { useEffect, useRef, useCallback, useState } from 'react';
import useMemberStore from '@/store/member-store';

export interface NotificationDataModel {
  id: number;
  content: string;
  type: string;
  case: string;
  created_at: string;
  receiver__name: string;
}

export interface NotificationMessageModel {
  type: string;
  notification?: NotificationDataModel;
  additional_data?: Record<string, unknown>;
}

export interface WebSocketStatusModel {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

interface UseWebSocketProps {
  onNewNotification?: (notification: NotificationDataModel) => void;
}

export const useWebSocket = ({ onNewNotification }: UseWebSocketProps = {}) => {
  const { factoryId } = useMemberStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const isConnectingRef = useRef(false); // 연결 시도 중 중복 방지

  const [status, setStatus] = useState<WebSocketStatusModel>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (!factoryId) {
      return;
    }

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      return;
    }

    if (isConnectingRef.current) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // 이미 연결된 경우
    }

    isConnectingRef.current = true;
    setStatus((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // 환경변수에서 API URL 가져오기
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        setStatus((prev) => ({
          ...prev,
          isConnecting: false,
          error: 'API URL이 설정되지 않았습니다.',
        }));
        return;
      }

      const wsUrl = `${apiUrl.replace(/^http/, 'ws')}/ws/notification/${factoryId}/`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isConnectingRef.current = false;
        setStatus({
          isConnected: true,
          isConnecting: false,
          error: null,
        });
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'user_connected') {
            // 연결 확인 메시지 - 조용히 처리
          } else if (
            data.type === 'notification_message' &&
            data.notification
          ) {
            onNewNotification?.(data.notification);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onclose = (event) => {
        if (event.code === 1006) {
          // WebSocket connection closed unexpectedly (1006)
        }

        setStatus((prev) => ({ ...prev, isConnected: false }));

        // 정상적인 종료가 아닌 경우에만 재연결 시도
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;

          if (wsRef.current) {
            wsRef.current = null;
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setStatus((prev) => ({
            ...prev,
            error: '최대 재연결 시도 횟수를 초과했습니다.',
          }));
        }
      };

      ws.onerror = () => {
        isConnectingRef.current = false; // 에러 발생 시 플래그 해제
        // WebSocket error occurred
        setStatus((prev) => ({
          ...prev,
          error:
            'WebSocket 연결 중 오류가 발생했습니다. 백엔드 WebSocket 엔드포인트를 확인해주세요.',
        }));
      };

      wsRef.current = ws;
    } catch {
      isConnectingRef.current = false; // 예외 발생 시 플래그 해제
      // WebSocket connection error occurred
      setStatus((prev) => ({
        ...prev,
        isConnecting: false,
        error: 'WebSocket 연결을 생성할 수 없습니다.',
      }));
    }
  }, [factoryId, onNewNotification]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setStatus({
      isConnected: false,
      isConnecting: false,
      error: null,
    });

    reconnectAttemptsRef.current = 0;
    isConnectingRef.current = false; // 연결 시도 플래그도 해제
  }, []);

  // 자동 재연결 (페이지 포커스 시)
  useEffect(() => {
    const handleFocus = () => {
      if (!status.isConnected && !status.isConnecting && !status.error) {
        connect();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.isConnected, status.isConnecting, status.error]);

  // 컴포넌트 마운트 시 연결, 언마운트 시 해제
  useEffect(() => {
    if (factoryId) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]); // connect, disconnect 제거

  return {
    status,
    connect,
    disconnect,
  };
};
