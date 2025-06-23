const PermissionTableHeader = () => {
  return (
    <div className="flex items-center justify-between w-full h-12 text-sv Me_Body-1 border-t border-b border-[#eeeeee]">
      <p className="flex-1">날짜</p>
      <p className="flex-[2]">카드</p>
      <p className="flex-1">금액</p>
      <p className="flex-1">플랜명</p>
    </div>
  );
};

export default PermissionTableHeader;
