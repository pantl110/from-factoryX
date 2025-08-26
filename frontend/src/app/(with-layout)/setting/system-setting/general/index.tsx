import Profile from './profile';
import CompanyInfo from './componay-info';
import DeleteAccount from './delete-account';
import useAuthStore from '@/store/auth-store';
import Spinner from '@/ui/spinner';

const General = () => {
  const { userInfo, isLoading } = useAuthStore();

  // 로딩 중인 경우
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-100">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-10">
      {/* 프로필 정보 */}
      <Profile userInfo={userInfo} />

      {/* 회사정보  */}
      <CompanyInfo />

      {/* 계정 삭제 */}
      <DeleteAccount />
    </div>
  );
};

export default General;
