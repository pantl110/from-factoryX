export const validateEmail = (email: string) => {
  if (!email) return "이메일을 입력해주세요.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "이메일 형식이 올바르지 않습니다.";
  return "";
};

export const validatePassword = (password: string) => {
  if (!password) return "비밀번호를 입력해주세요.";
  return "";
};
