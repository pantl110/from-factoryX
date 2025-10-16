export const UnitTableHeader = () => {
  return (
    <div className="flex h-12 items-center py-1 px-3 w-full border-t border-b border-lg Me_Body-1 text-sv">
      <p className="flex-1 px-3">구분</p>
      <p className="flex-1 px-3">이름</p>
      <p className="flex-1 px-3">기준/변환 단위</p>
      <p className="flex-1 px-3">변환식</p>
      <p className="flex-1 px-3">소수점 규칙</p>
      <p className="flex-[0.4] px-3">액션</p>
    </div>
  );
};
