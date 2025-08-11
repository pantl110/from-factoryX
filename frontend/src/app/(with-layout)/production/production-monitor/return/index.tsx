import ReturnTableHeader from './return-table-header';
import ReturnTableItem from './return-table-item';
import ReturnInfo from './return-info';
import { returnData } from '@/mocks/return-data';

const ReturnSection = () => {
  return (
    <div className="flex-1 h-full min-h-0 flex flex-col gap-7 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-3">
        <ReturnInfo returnData={returnData[0]} />
        <div>
          <ReturnTableHeader />
          <ReturnTableItem />
          <ReturnTableItem />
        </div>
      </div>
      {/* <div>
        <ReturnInfo returnData={returnData[1]} isProduction={true} />
      </div> */}
    </div>
  );
};

export default ReturnSection;
