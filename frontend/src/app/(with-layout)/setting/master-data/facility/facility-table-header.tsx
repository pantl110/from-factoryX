const FacilityTableHeader = () => {
  return (
    <div className="flex h-12 items-center py-1 px-3 w-full border-t border-b border-[#eeeeee] Me_Body-1 text-sv">
      <p className="flex-1">가동 상태</p>
      <p className="flex-1">설비명</p>
      <p className="flex-1">자동 배정 순위</p>
      <p className="flex-2">설비위치</p>
    </div>
  );
};

export default FacilityTableHeader;
