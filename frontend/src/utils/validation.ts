export const validateEmail = (email: string, t?: (key: string) => string) => {
  if (!email) {
    return t ? t('login.email.required') : '이메일을 입력해주세요.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return t
      ? t('login.email.invalidFormat')
      : '이메일 형식이 올바르지 않습니다.';
  }
  return '';
};

export const validatePassword = (
  password: string,
  t?: (key: string) => string
) => {
  if (!password)
    return t
      ? t('signup.passwordStep.password.required')
      : '비밀번호를 입력해주세요.';

  if (password.length < 8 || password.length > 20) {
    return t
      ? t('signup.passwordStep.password.length')
      : '비밀번호는 8자 이상 20자 이하여야 합니다.';
  }

  if (!/[A-Z]/.test(password)) {
    return t
      ? t('signup.passwordStep.password.uppercase')
      : '영어 대문자(A-Z)를 포함해야 합니다.';
  }

  if (!/[a-z]/.test(password)) {
    return t
      ? t('signup.passwordStep.password.lowercase')
      : '영어 소문자(a-z)를 포함해야 합니다.';
  }

  if (!/[0-9]/.test(password)) {
    return t
      ? t('signup.passwordStep.password.number')
      : '숫자(0-9)를 포함해야 합니다.';
  }

  // 연속된 문자 또는 숫자 체크 (3개 이상)
  if (/(.)\1{2,}/.test(password)) {
    return t
      ? t('signup.passwordStep.password.consecutive')
      : '연속된 문자나 숫자는 사용할 수 없습니다.';
  }

  // 쉬운 패턴 체크 - 정규식으로 한번에 처리
  // const weakPatterns = /(abcd|1234|qwerty|asdf|zxcv|password|iloveyou|admin|111111|000000|aaaaaa|zzzzzz)/i;
  // if (weakPatterns.test(password)) {
  //   return "쉬운 패턴은 사용할 수 없습니다.";
  // }

  return '';
};

/**
 * 백엔드 FactoryClient 모델의 max_length를 그대로 옮긴 값.
 * 서버는 길이 초과를 검증하지 않고 그대로 INSERT하므로, 초과 시 DB에서 DataError(500)가 난다.
 * OCR 결과에는 "등록번호 123-45-67890-1"처럼 노이즈가 섞여 들어오기 때문에 저장 전에 여기서 막는다.
 */
export const CLIENT_FIELD_LIMITS = {
  name: 100,
  business_registration_number: 12, // "123-45-67890" 포맷 기준
  representative_name: 50,
  email: 100,
  phone: 15,
  fax: 15,
  business_type: 100,
  business_category: 100,
  manager: 100,
  // address는 백엔드가 TextField라 길이 제한 없음
} as const;

export type ClientLimitedFieldType = keyof typeof CLIENT_FIELD_LIMITS;
