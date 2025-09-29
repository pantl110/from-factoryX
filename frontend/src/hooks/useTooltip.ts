import { useState, useCallback } from 'react';

export interface UseTooltipOptions {
  /**
   * 호버 시작 후 툴팁이 나타나기까지의 지연 시간 (ms)
   * @default 300
   */
  showDelay?: number;
  /**
   * 호버 종료 후 툴팁이 사라지기까지의 지연 시간 (ms)
   * @default 100
   */
  hideDelay?: number;
}

export interface UseTooltipReturn {
  /** 툴팁이 현재 보이는지 여부 */
  isVisible: boolean;
  /** 호버 시작 시 호출할 핸들러 */
  onMouseEnter: () => void;
  /** 호버 종료 시 호출할 핸들러 */
  onMouseLeave: () => void;
  /** 수동으로 툴팁을 보이게 하는 함수 */
  show: () => void;
  /** 수동으로 툴팁을 숨기는 함수 */
  hide: () => void;
}

/**
 * 호버 시 툴팁을 표시하는 기능을 제공하는 훅
 */
export const useTooltip = (options: UseTooltipOptions = {}): UseTooltipReturn => {
  const { showDelay = 300, hideDelay = 100 } = options;
  
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  const clearTimeouts = useCallback(() => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      setShowTimeout(null);
    }
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  }, [showTimeout, hideTimeout]);

  const show = useCallback(() => {
    clearTimeouts();
    setIsVisible(true);
  }, [clearTimeouts]);

  const hide = useCallback(() => {
    clearTimeouts();
    setIsVisible(false);
  }, [clearTimeouts]);

  const onMouseEnter = useCallback(() => {
    clearTimeouts();
    
    const timeout = setTimeout(() => {
      setIsVisible(true);
      setShowTimeout(null);
    }, showDelay);
    
    setShowTimeout(timeout);
  }, [clearTimeouts, showDelay]);

  const onMouseLeave = useCallback(() => {
    clearTimeouts();
    
    const timeout = setTimeout(() => {
      setIsVisible(false);
      setHideTimeout(null);
    }, hideDelay);
    
    setHideTimeout(timeout);
  }, [clearTimeouts, hideDelay]);

  return {
    isVisible,
    onMouseEnter,
    onMouseLeave,
    show,
    hide,
  };
};

export default useTooltip;
