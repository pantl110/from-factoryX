const FacilityTableHeader = () => {
  return (
    <div className="flex h-12 items-center py-1 px-3 w-full border-t border-b border-[#eeeeee] Me_Body-1 text-sv">
      <p className="w-[150px]">가동 상태</p>
      <p className="w-[250px]">설비명</p>
      <p className="flex-1">생산 가능 품목</p>
      <p className="w-[150px]">자동 배정 순위</p>
    </div>
  );
};

export default FacilityTableHeader;
