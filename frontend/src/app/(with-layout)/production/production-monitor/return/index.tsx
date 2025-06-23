import ReturnTableHeader from "./return-table-header";
import ReturnTableItem from "./return-table-item";
import ReturnInfo from "./return-info";
import { returnData } from "@/mocks/return-data";

const ReturnSection = () => {
  return (
    <div className="flex-1 h-full">
      {returnData.map((item) => (
        <ReturnInfo key={item.id} returnData={item} />
      ))}

      <div className="hidden">
        <ReturnTableHeader />
        <ReturnTableItem />
        <ReturnTableItem />
        <ReturnTableItem />
      </div>
    </div>
  );
};

export default ReturnSection;
