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
    return (
      <div className="py-8 h-full flex flex-col justify-center items-center gap-2 rounded-[4px] border border-[#E4E4E7]">
        <h4 className="Heading-4 text-dg">히스토리가 아직 없어요.</h4>
        <p className="R_Body-1 text-gr">
          처음 등록된 품목이라, 과거 단가나 수량 기록이 아직 없어요.
        </p>
      </div>
    );
  }
};

export default History;
