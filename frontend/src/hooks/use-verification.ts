import { useState, useEffect } from "react";

interface UseVerificationProps {
  initialTime?: number;
}

export const useVerification = ({
  initialTime = 180,
}: UseVerificationProps = {}) => {
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (!isVerificationSent || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerificationSent, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const startVerification = () => {
    setIsVerificationSent(true);
    setTimeLeft(initialTime);
  };

  const completeVerification = () => {
    setIsVerificationComplete(true);
  };

  const handleResetTimer = () => {
    setTimeLeft(initialTime);
  };

  const reset = () => {
    setIsVerificationSent(false);
    setIsVerificationComplete(false);
    setTimeLeft(initialTime);
  };

  return {
    isVerificationSent,
    isVerificationComplete,
    timeLeft,
    formatTime,
    startVerification,
    completeVerification,
    handleResetTimer,
    reset,
  };
};
