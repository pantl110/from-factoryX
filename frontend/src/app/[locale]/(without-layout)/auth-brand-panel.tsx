import PantlLogo from '@/ui/icons/pantl-logo';

/**
 * 로그인 / 회원가입 / 비밀번호 찾기 페이지 좌측 브랜드 패널
 * 세 페이지가 동일한 마크업을 공유하므로 공통 컴포넌트로 분리
 */
const AuthBrandPanel = () => {
  return (
    <div className="flex-[0.8] bg-bg flex flex-col items-center justify-center">
      <PantlLogo width={168.908} height={30.558} color="#5F6870" />
    </div>
  );
};

export default AuthBrandPanel;
