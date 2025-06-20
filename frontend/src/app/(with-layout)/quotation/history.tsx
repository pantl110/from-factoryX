import HistoryItem from "./history-item";
import dummyHistoryItems from "@/mocks/history-items";
import { ProductProps } from "./types";

interface HistoryProps {
  selectedProduct: ProductProps;
}

const History = ({ selectedProduct }: HistoryProps) => {
  const filteredHistoryItems = dummyHistoryItems.filter(
    (item) => item.productName === selectedProduct.productName,
  );

  if (filteredHistoryItems.length > 0) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="flex-2 py-1 px-3 ">품목정보</p>
          <p className="flex-1 py-1 px-3 ">제작수량</p>
          <p className="w-[100px] py-1 px-3 ">단가</p>
          <p className="flex-1 py-1 px-3 ">금액</p>
        </div>
        {filteredHistoryItems.map((item, idx) => (
          <HistoryItem key={idx} {...item} />
        ))}
      </div>
    );
  } else {
    // 히스토리 데이터 없을 때
    return <div>no history</div>;
  }
};

export default History;
