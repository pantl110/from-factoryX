import Profile from "./profile";
import CompanyInfo from "./componay-info";
import DeleteAccount from "./delete-account";

const General = () => {
  return (
    <div className="px-10">
      {/* 프로필 정보 */}
      <Profile />

      {/* 회사정보  */}
      <CompanyInfo />

      {/* 계정 삭제 */}
      <DeleteAccount />
    </div>
  );
};

export default General;
