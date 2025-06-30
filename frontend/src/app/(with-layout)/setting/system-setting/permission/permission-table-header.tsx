const PermissionTableHeader = () => {
  return (
    <div className="flex items-center justify-between w-full h-12 text-sv Me_Body-1 border-t border-b border-[#eeeeee]">
      <p className="px-3 w-[150px]">초대 상태</p>
      <p className="px-3 w-[150px]">이름</p>
      <p className="px-3 flex-1">이메일</p>
      <p className="px-3 w-[150px]">권한</p>
      <p className="px-3 w-[150px]">초대 날짜</p>
      <div className="w-9"></div>
    </div>
  );
};

export default PermissionTableHeader;
