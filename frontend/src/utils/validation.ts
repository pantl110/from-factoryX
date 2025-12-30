export const validateEmail = (
  email: string,
  t?: (key: string) => string
) => {
  if (!email) {
    return t ? t('login.email.required') : '이메일을 입력해주세요.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return t ? t('login.email.invalidFormat') : '이메일 형식이 올바르지 않습니다.';
  }
  return '';
};

export const validatePassword = (password: string) => {
  if (!password) return '비밀번호를 입력해주세요.';

  if (password.length < 8 || password.length > 20) {
    return '비밀번호는 8자 이상 20자 이하여야 합니다.';
  }

  if (!/[A-Z]/.test(password)) {
    return '영어 대문자(A-Z)를 포함해야 합니다.';
  }

  if (!/[a-z]/.test(password)) {
    return '영어 소문자(a-z)를 포함해야 합니다.';
  }

  if (!/[0-9]/.test(password)) {
    return '숫자(0-9)를 포함해야 합니다.';
  }

  // 연속된 문자 또는 숫자 체크 (3개 이상)
  if (/(.)\1{2,}/.test(password)) {
    return '연속된 문자나 숫자는 사용할 수 없습니다.';
  }

  // 쉬운 패턴 체크 - 정규식으로 한번에 처리
  // const weakPatterns = /(abcd|1234|qwerty|asdf|zxcv|password|iloveyou|admin|111111|000000|aaaaaa|zzzzzz)/i;
  // if (weakPatterns.test(password)) {
  //   return "쉬운 패턴은 사용할 수 없습니다.";
  // }

  return '';
};
