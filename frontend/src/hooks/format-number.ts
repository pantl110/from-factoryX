// 숫자만 추출하는 함수
export const extractNumbers = (value: string): string => {
  if (!value) return ''
  return value.replace(/[^0-9]/g, '')
}

// 날짜 포맷팅 함수 (YYYY-MM-DD)
export const formatDate = (value: string): string => {
  const numbers = extractNumbers(value)

  if (numbers.length <= 4) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
  } else {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`
  }
}

// 사업자등록번호 포맷팅 함수
export const formatBusinessNumber = (value: string): string => {
  const numbers = extractNumbers(value) // 숫자만 추출

  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`
  }
}

// 전화번호 포맷팅 함수 (2자리/3자리 국번 모두 지원)
export const formatPhoneNumber = (value: string): string => {
  const numbers = extractNumbers(value)

  if (numbers.length < 2) {
    return numbers
  }

  // 2자리 국번 (서울: 02)
  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    } else {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    }
  }

  // 3자리 국번 (그 외 지역/휴대폰)
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }
}

// 팩스 번호 포맷팅 함수
export const formatFaxNumber = (value: string): string => {
  const numbers = extractNumbers(value) // 숫자만 추출

  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
  } else {
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5, 9)}`
  }
}

// 숫자와 하이픈만 허용하는 키 이벤트 핸들러
export const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  ]

  if (!allowedKeys.includes(e.key)) {
    e.preventDefault()
  }
}

// 시간 포맷팅 함수 (HH:MM)
export const formatTime = (value: string): string => {
  const numbers = extractNumbers(value)

  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}:${numbers.slice(2)}`
  } else {
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`
  }
}

// 날짜와 시간 포맷팅 함수 (YYYY-MM-DD HH:MM)
export const formatDateTime = (value: string): string => {
  const numbers = extractNumbers(value)

  if (numbers.length <= 4) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6)}`
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)} ${numbers.slice(8)}`
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)} ${numbers.slice(8, 10)}:${numbers.slice(10)}`
  } else {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)} ${numbers.slice(8, 10)}:${numbers.slice(10, 12)}`
  }
}
