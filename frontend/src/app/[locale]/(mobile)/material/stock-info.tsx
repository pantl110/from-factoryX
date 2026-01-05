import { LocationModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import StockInfoItem from './stock-info-item';
import { useTranslations } from 'next-intl';

interface StockInfoProps {
  locations?: LocationModel[];
  isLoading?: boolean;
}

const StockInfo = ({ locations = [], isLoading }: StockInfoProps) => {
  const t = useTranslations('mobile.stockInfo');
  const tStock = useTranslations('stock.stockLocation.empty');
  const hasLocations = locations.length > 0;

  return (
    <div className="pt-8 flex flex-col">
      <h3 className="px-7 m-Heading-3-semibold">{t('title')}</h3>

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
          <NoHistoryBox text={tStock('title')} />
        </div>
      )}
    </div>
  );
};

export default StockInfo;
