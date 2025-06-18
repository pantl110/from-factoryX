const ClientTableHeader = () => {
  return (
    <div className="flex h-12 items-center py-1 px-3 w-full border-t border-b border-[#eeeeee] Me_Body-1 text-sv">
      <p className="flex-1">회사명</p>
      <p className="flex-1">사업자등록번호</p>
      <p className="w-[100px]">대표자명</p>
      <p className="w-[200px]">업태</p>
      <p className="flex-1">종목</p>
      <p className="w-[150px]">연락처</p>
      <p className="flex-1">이메일</p>
    </div>
  );
};

export default ClientTableHeader;
