import { useState, useEffect, useCallback } from "react";

interface UseToastReturnProps {
  isToastOpen: boolean;
  isVisible: boolean;
  showToast: () => void;
  hideToast: () => void;
}

const useToast = (duration: number = 2000): UseToastReturnProps => {
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const showToast = useCallback(() => {
    setIsToastOpen(true);
    setIsVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setIsToastOpen(false), 300);
  }, []);

  useEffect(() => {
    if (isToastOpen) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setIsToastOpen(false), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isToastOpen, duration]);

  return {
    isToastOpen,
    isVisible,
    showToast,
    hideToast,
  };
};

export default useToast;
