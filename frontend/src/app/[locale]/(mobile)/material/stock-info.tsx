import { LocationModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import StockInfoItem from './stock-info-item';

interface StockInfoProps {
  locations?: LocationModel[];
  isLoading?: boolean;
}

const StockInfo = ({ locations = [], isLoading }: StockInfoProps) => {
  const hasLocations = locations.length > 0;

  return (
    <div className="pt-8 flex flex-col">
      <h3 className="px-7 m-Heading-3-semibold">재고 정보</h3>

      {isLoading ? (
        <></>
      ) : hasLocations ? (
        <>
          {locations.map((location) => (
            <StockInfoItem key={location.id} location={location} />
          ))}
        </>
      ) : (
        <div className="px-7 pt-8">
          <NoHistoryBox text="등록된 창고 위치가 아직 없어요." />
        </div>
      )}
    </div>
  );
};

export default StockInfo;
