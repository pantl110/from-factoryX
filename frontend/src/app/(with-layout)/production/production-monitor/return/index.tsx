import ReturnTableHeader from "./return-table-header";
import ReturnTableItem from "./return-table-item";
import ReturnInfo from "./return-info";
import { returnData } from "@/mocks/return-data";

const ReturnSection = () => {
  return (
    <div className="flex-1 h-full min-h-0 pt-5 flex flex-col gap-7 overflow-y-auto">
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
