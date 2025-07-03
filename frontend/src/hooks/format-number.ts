// 숫자만 추출하는 함수
export const extractNumbers = (value: string): string => {
  if (!value) return "";
  return value.replace(/[^0-9]/g, "");
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

// 전화번호 포맷팅 함수
export const formatPhoneNumber = (value: string): string => {
  const numbers = extractNumbers(value); // 숫자만 추출

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

// 팩스 번호 포맷팅 함수
export const formatFaxNumber = (value: string): string => {
  const numbers = extractNumbers(value); // 숫자만 추출

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  } else {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }
};

// 숫자와 하이픈만 허용하는 키 이벤트 핸들러
export const handleNumberKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
) => {
  const allowedKeys = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "Backspace",
    "Delete",
    "Tab",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ];

  if (!allowedKeys.includes(e.key)) {
    e.preventDefault();
  }
};
