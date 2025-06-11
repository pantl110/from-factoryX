const TabSet = () => {
  return (
    <div className="flex gap-4 items-center B_Heading-3">
      <h3 className="text-dg">전체</h3>
      <h3 className="text-gr">견적 협의</h3>
      <h3 className="text-gr">생산 대기</h3>
      <h3 className="text-gr">생산 중</h3>
      <h3 className="text-gr">생산 완료</h3>
      <h3 className="text-gr">납품</h3>
    </div>
  );
};

export default TabSet;
