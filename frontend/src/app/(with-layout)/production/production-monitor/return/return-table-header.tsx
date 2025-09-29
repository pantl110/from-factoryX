const ReturnTableHeader = () => {
  return (
    <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv cursor-default">
      <p className="flex-[2] px-3">품목명</p>
      <p className="flex-1 px-3">품목코드</p>
      <p className="flex-1 px-3">규격</p>
      <p className="w-[80px] px-3">단위</p>
    </div>
  );
};

export default ReturnTableHeader;
