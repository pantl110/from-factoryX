// 숫자만 추출하는 함수
export const extractNumbers = (value: string): string => {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '');
};

// 날짜 포맷팅 함수 (YYYY-MM-DD)
export const formatDate = (value: string): string => {
  const numbers = extractNumbers(value);

  if (numbers.length <= 4) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  } else {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
  }
};

// 사업자등록번호 포맷팅 함수
export const formatBusinessNumber = (value: string): string => {
  const numbers = extractNumbers(value); // 숫자만 추출

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  }
};

// 전화번호 포맷팅 함수 (2자리/3자리 국번 모두 지원)
export const formatPhoneNumber = (value: string): string => {
  const numbers = extractNumbers(value);

  if (numbers.length < 2) {
    return numbers;
  }

  // 2자리 국번 (서울: 02)
  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    } else {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
  }

  // 3자리 국번 (그 외 지역/휴대폰)
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

// 팩스 번호 포맷팅 함수
export const formatFaxNumber = (value: string): string => {
  const numbers = extractNumbers(value); // 숫자만 추출

  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 3) {
    // 3자리일 때는 하이픈 없이 그대로 반환
    return numbers;
  } else if (numbers.length <= 6) {
    // 지역번호가 3자리인 경우 (031, 032, 033 등)
    if (
      numbers.startsWith('031') ||
      numbers.startsWith('032') ||
      numbers.startsWith('033') ||
      numbers.startsWith('041') ||
      numbers.startsWith('042') ||
      numbers.startsWith('043') ||
      numbers.startsWith('051') ||
      numbers.startsWith('052') ||
      numbers.startsWith('053') ||
      numbers.startsWith('054') ||
      numbers.startsWith('055') ||
      numbers.startsWith('061') ||
      numbers.startsWith('062') ||
      numbers.startsWith('063') ||
      numbers.startsWith('064')
    ) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      // 지역번호가 2자리인 경우 (02, 03 등)
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    }
  } else if (numbers.length <= 7) {
    // 지역번호가 3자리인 경우 (031-573-8051)
    if (
      numbers.startsWith('031') ||
      numbers.startsWith('032') ||
      numbers.startsWith('033') ||
      numbers.startsWith('041') ||
      numbers.startsWith('042') ||
      numbers.startsWith('043') ||
      numbers.startsWith('051') ||
      numbers.startsWith('052') ||
      numbers.startsWith('053') ||
      numbers.startsWith('054') ||
      numbers.startsWith('055') ||
      numbers.startsWith('061') ||
      numbers.startsWith('062') ||
      numbers.startsWith('063') ||
      numbers.startsWith('064')
    ) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    } else {
      // 지역번호가 2자리인 경우 (02-123-4567)
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
    }
  } else {
    // 8자리 이상인 경우
    if (
      numbers.startsWith('031') ||
      numbers.startsWith('032') ||
      numbers.startsWith('033') ||
      numbers.startsWith('041') ||
      numbers.startsWith('042') ||
      numbers.startsWith('043') ||
      numbers.startsWith('051') ||
      numbers.startsWith('052') ||
      numbers.startsWith('053') ||
      numbers.startsWith('054') ||
      numbers.startsWith('055') ||
      numbers.startsWith('061') ||
      numbers.startsWith('062') ||
      numbers.startsWith('063') ||
      numbers.startsWith('064')
    ) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    } else {
      // 지역번호가 2자리인 경우 (02-1234-5678)
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
  }
};

// 숫자와 소수점만 허용하는 키 이벤트 핸들러 (한글 입력 차단)
export const handleNumberKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>
) => {
  const allowedKeys = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '.',
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];

  // 한글 입력 차단
  if (e.nativeEvent.isComposing) {
    e.preventDefault();
    return;
  }

  if (!allowedKeys.includes(e.key)) {
    e.preventDefault();
  }
};

// 실시간 정수 입력 포맷팅 함수 (입력 중에 콤마 표시, 정수만 허용)
export const handleIntegerInput = (
  inputValue: string
): {
  displayValue: string;
  numericValue: number;
  isValid: boolean;
} => {
  // 빈 문자열 처리
  if (!inputValue || inputValue === '') {
    return {
      displayValue: '',
      numericValue: 0,
      isValid: true,
    };
  }

  // 콤마 제거 후 숫자만 허용
  const cleanValue = inputValue.replace(/[^0-9]/g, '');

  // 숫자 변환
  const numericValue = cleanValue === '' ? 0 : parseInt(cleanValue) || 0;

  // 유효성 검사
  const isValid = !isNaN(numericValue) && numericValue >= 0;

  // 콤마 포함된 포맷팅 적용
  const displayValue =
    numericValue === 0 ? '' : numericValue.toLocaleString('en-US');

  return {
    displayValue,
    numericValue,
    isValid,
  };
};

// 실시간 수량 입력 포맷팅 함수 (입력 중에 콤마 표시, 소수점 한자리까지 허용)
export const handleQuantityInput = (
  inputValue: string
): {
  displayValue: string;
  numericValue: number;
  isValid: boolean;
} => {
  // 빈 문자열 처리
  if (!inputValue || inputValue === '') {
    return {
      displayValue: '',
      numericValue: 0,
      isValid: true,
    };
  }

  // 콤마 제거
  let cleanValue = inputValue.replace(/,/g, '');

  // 소수점이 여러 개인지 확인하고 정리
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    // 소수점이 여러 개면 첫 번째만 유지
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }

  // 숫자와 소수점만 허용
  const numericOnly = cleanValue.replace(/[^0-9.]/g, '');

  // 소수점이 여러 개인 경우 다시 정리
  const finalParts = numericOnly.split('.');
  const finalCleanValue =
    finalParts.length > 2
      ? finalParts[0] + '.' + finalParts.slice(1).join('')
      : numericOnly;

  // 소수점이 있는 경우 소수점 이하 한자리로 제한
  let formattedValue = finalCleanValue;
  if (finalCleanValue.includes('.')) {
    const [integerPart, decimalPart] = finalCleanValue.split('.');
    if (decimalPart && decimalPart.length > 1) {
      formattedValue = integerPart + '.' + decimalPart.slice(0, 1);
    }
  }

  // 숫자 변환
  const numericValue =
    formattedValue === '' ? 0 : parseFloat(formattedValue) || 0;

  // 유효성 검사
  const isValid = !isNaN(numericValue) && numericValue >= 0;

  // 콤마 포함된 포맷팅 적용
  let displayValue = '';
  if (formattedValue !== '') {
    if (formattedValue.includes('.')) {
      // 소수점이 있는 경우
      const [integerPart, decimalPart] = formattedValue.split('.');
      const formattedInteger = parseInt(integerPart || '0').toLocaleString(
        'en-US'
      );
      displayValue = `${formattedInteger}.${decimalPart}`;
    } else {
      // 정수인 경우
      const intValue = parseInt(formattedValue || '0');
      displayValue = intValue === 0 ? '' : intValue.toLocaleString('en-US');
    }
  }

  return {
    displayValue,
    numericValue,
    isValid,
  };
};

// 시간 포맷팅 함수 (HH:MM)
export const formatTime = (value: string): string => {
  const numbers = extractNumbers(value);

  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  }
};

// 날짜와 시간 포맷팅 함수 (YYYY-MM-DD HH:MM)
export const formatDateTime = (value: string): string => {
  const numbers = extractNumbers(value);

  if (numbers.length <= 4) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6)}`;
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)} ${numbers.slice(8)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)} ${numbers.slice(8, 10)}:${numbers.slice(10)}`;
  } else {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)} ${numbers.slice(8, 10)}:${numbers.slice(10, 12)}`;
  }
};

// 숫자 포맷팅 함수 (콤마 추가, 소수점 아래 끝자리 0 제거)
export const removeTrailingZeros = (
  num: string | number
): string => {
  if (num === '' || num === undefined || num === null) return '';
  const str = String(num).replace(/,/g, '');
  // 소수점이 있는 경우 처리
  if (str.includes('.')) {
    // 소수점 아래 끝자리 0들을 제거 (예: 100.50 → 100.5, 100.00 → 100)
    // 정규식: 소수점 뒤의 끝자리 0들을 제거하되, 소수점만 남으면 소수점도 제거
    let trimmed = str.replace(/0+$/, ''); // 끝자리 0 제거
    if (trimmed.endsWith('.')) {
      trimmed = trimmed.slice(0, -1); // 소수점만 남으면 소수점도 제거
    }
    return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
