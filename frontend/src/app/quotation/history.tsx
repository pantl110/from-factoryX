import HistoryItem from "./history-item";

const History = () => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center w-full h-12 bg-bg Me_Body-1 rounded text-sv">
        <p className="flex-[2] py-1 px-3 ">품목정보</p>
        <p className="w-[100px] py-1 px-3 ">단가</p>
        <p className="flex-1 py-1 px-3 ">제작수량</p>
        <p className="flex-1 py-1 px-3 ">금액</p>
      </div>
      <HistoryItem />
      <HistoryItem />
      <HistoryItem />
      <HistoryItem />
      <HistoryItem />
    </div>
  );
};

export default History;
