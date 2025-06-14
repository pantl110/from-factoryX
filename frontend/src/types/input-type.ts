export type InputType =
  | "text" // 기본 텍스트
  | "password" // 비밀번호
  | "email" // 이메일
  | "number" // 숫자
  | "tel" // 전화번호
  | "url" // URL
  | "search" // 검색
  | "date" // 날짜
  | "datetime-local" // 날짜와 시간
  | "time" // 시간
  | "week" // 주
  | "month" // 월
  | "color" // 색상 선택
  | "file" // 파일 업로드
  | "range" // 범위 선택
  | "hidden" // 숨김
  | "checkbox" // 체크박스
  | "radio"; // 라디오 버튼

export interface InputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: InputType;
}
