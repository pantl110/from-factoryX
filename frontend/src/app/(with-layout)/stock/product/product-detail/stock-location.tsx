import StockLocationItem from './stock-location-item';

interface StockLocationProps {
  itemCount?: number;
  onItemDelete?: (index: number) => void;
  onPlusClick?: (index: number) => void;
}

const StockLocation = ({
  itemCount = 1,
  onItemDelete,
  onPlusClick,
}: StockLocationProps) => {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: itemCount }, (_, index) => (
        <StockLocationItem
          key={index}
          onDelete={index === 0 ? undefined : () => onItemDelete?.(index)}
          onPlusClick={onPlusClick ? () => onPlusClick(index) : undefined}
        />
      ))}
    </div>
  );
};

export default StockLocation;
