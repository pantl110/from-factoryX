import { useEffect, useRef, useCallback, useState } from 'react';
import useFactoryStore from '@/store/factory-store';

export interface NotificationData {
  id: number;
  content: string;
  type: string;
  case: string;
  created_at: string;
  receiver__name: string;
}

export interface NotificationMessage {
  type: string;
  notification?: NotificationData;
  additional_data?: any;
}

export interface WebSocketStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

interface UseWebSocketProps {
  onNewNotification?: (notification: NotificationData) => void;
}

export const useWebSocket = ({ onNewNotification }: UseWebSocketProps = {}) => {
  const { factoryId } = useFactoryStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3초

  const [status, setStatus] = useState<WebSocketStatus>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(() => {
    if (!factoryId) {
      console.log('🐍 No factory ID available, skipping WebSocket connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // 이미 연결된 경우
    }

    setStatus(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // 환경변수에서 API URL 가져오기
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        console.error('🐍 NEXT_PUBLIC_API_URL environment variable is not set');
        setStatus(prev => ({ 
          ...prev, 
          isConnecting: false, 
          error: 'API URL이 설정되지 않았습니다.' 
        }));
        return;
      }
      
      // HTTP URL을 WebSocket URL로 변환
      const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws/notification/${factoryId}`;
      
      console.log('🐍 Attempting to connect to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🐍 WebSocket connected successfully to factory:', factoryId);
        setStatus({
          isConnected: true,
          isConnecting: false,
          error: null,
        });
        reconnectAttemptsRef.current = 0; // 연결 성공 시 재시도 횟수 초기화
      };

      ws.onmessage = (event) => {
        try {
          const data: NotificationMessage = JSON.parse(event.data);
          
          // 새 알림만 처리
          if (data.type === 'new_notification' && data.notification) {
            console.log('🐍 New notification received:', data.notification.content);
            onNewNotification?.(data.notification);
          }
        } catch (error) {
          console.error('🐍 WebSocket message parse error:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🐍 WebSocket disconnected:', event.code, event.reason);
        setStatus(prev => ({ ...prev, isConnected: false }));
        
        // 정상적인 종료가 아닌 경우에만 재연결 시도
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`🐍 Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current); // 지수 백오프
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setStatus(prev => ({ 
            ...prev, 
            error: '최대 재연결 시도 횟수를 초과했습니다.' 
          }));
        }
      };

      ws.onerror = (error) => {
        console.error('🐍 WebSocket error:', error);
        setStatus(prev => ({ 
          ...prev, 
          error: '웹소켓 연결 중 오류가 발생했습니다.' 
        }));
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('🐍 WebSocket connection error:', error);
      setStatus(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: '웹소켓 연결을 생성할 수 없습니다.' 
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
  }, []);

  // 자동 재연결 (페이지 포커스 시)
  useEffect(() => {
    const handleFocus = () => {
      if (!status.isConnected && !status.isConnecting && !status.error) {
        console.log('🐍 Page focused, attempting to reconnect...');
        connect();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status.isConnected, status.isConnecting, status.error, connect]);

  // 컴포넌트 마운트 시 연결, 언마운트 시 해제
  useEffect(() => {
    if (factoryId) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [factoryId, connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
  };
};
