import { useState, useEffect } from 'react'

interface UseVerificationProps {
  initialTime?: number
}

// 회원가입 페이지에서 이메일 인증 시
export const useVerification = ({ initialTime = 180 }: UseVerificationProps = {}) => {
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [isVerificationComplete, setIsVerificationComplete] = useState(false)
  const [timeLeft, setTimeLeft] = useState(initialTime)

  useEffect(() => {
    if (!isVerificationSent || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isVerificationSent, timeLeft])

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 인증 시작
  const startVerification = () => {
    setIsVerificationSent(true)
    setTimeLeft(initialTime)
  }

  // 인증 완료
  const completeVerification = () => {
    setIsVerificationComplete(true)
  }

  // 타이머 초기화
  const handleResetTimer = () => {
    setTimeLeft(initialTime)
  }

  // 인증 초기화
  const reset = () => {
    setIsVerificationSent(false)
    setIsVerificationComplete(false)
    setTimeLeft(initialTime)
  }

  return {
    isVerificationSent,
    isVerificationComplete,
    timeLeft,
    formatTime,
    startVerification,
    completeVerification,
    handleResetTimer,
    reset,
  }
}
