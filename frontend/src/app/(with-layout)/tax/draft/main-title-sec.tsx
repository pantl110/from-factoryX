interface MainTitleSecProps {
  selectedTab: "전체" | "임시 저장" | "발행 대기";
  setSelectedTab: (tab: "전체" | "임시 저장" | "발행 대기") => void;
}

const MainTitleSec = ({ selectedTab, setSelectedTab }: MainTitleSecProps) => {
  const tabs = ["전체", "임시 저장", "발행 대기"];

  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <div className="Heading-1 text-dg">세금계산서 임시보관함</div>
      </div>

      <div className="flex gap-4 items-center Heading-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${
              selectedTab === tab ? "text-dg" : "text-gr"
            } cursor-pointer`}
            onClick={() =>
              setSelectedTab(tab as "전체" | "임시 저장" | "발행 대기")
            }
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainTitleSec;
