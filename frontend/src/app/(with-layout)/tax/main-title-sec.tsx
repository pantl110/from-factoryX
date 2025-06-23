const MainTitleSec = () => {
  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <div className="Heading-1 text-dg">세무/회계</div>
      </div>
      <div className="flex gap-4 items-center Heading-3">
        <h3 className="text-dg">전체</h3>
        <h3 className="text-gr">매출</h3>
        <h3 className="text-gr">매입</h3>
      </div>
    </div>
  );
};

export default MainTitleSec;
