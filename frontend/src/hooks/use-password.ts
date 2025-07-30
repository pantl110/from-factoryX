import { useState } from 'react';

interface UsePasswordProps {
  validatePassword?: (password: string) => string;
}

export const usePassword = ({ validatePassword }: UsePasswordProps = {}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (validatePassword) {
      const errorMessage = validatePassword(value);
      setErrors((prev) => ({ ...prev, password: errorMessage }));
    }
    if (value && confirmPassword && value !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: '비밀번호가 일치하지 않습니다.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value && password && value !== password) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: '비밀번호가 일치하지 않습니다.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const reset = () => {
    setPassword('');
    setConfirmPassword('');
    setErrors({ password: '', confirmPassword: '' });
  };

  const isValid =
    password && confirmPassword && !errors.password && !errors.confirmPassword;

  return {
    password,
    confirmPassword,
    errors,
    handlePasswordChange,
    handleConfirmPasswordChange,
    reset,
    isValid,
  };
};
