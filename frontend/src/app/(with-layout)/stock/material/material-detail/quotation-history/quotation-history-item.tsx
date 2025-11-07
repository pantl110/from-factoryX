import { convertUTCToKSTDate } from '@/hooks';
import { MaterialHistoryResponseModel } from '@/types/data-model';
import IconBtn from '@/ui/icon-btn';
import { ArrowLineUpRight } from '@phosphor-icons/react';

interface QuotationHistoryItemProps {
  onClick: () => void;
  data: MaterialHistoryResponseModel;
}

const QuotationHistoryItem = ({ onClick, data }: QuotationHistoryItemProps) => {
  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-default">
      <div
        className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0"
        title={data.client_name || '-'}
      >
        <p className="text-dg truncate">{data.client_name || '-'}</p>
        <IconBtn
          icon={ArrowLineUpRight}
          size="w-9 h-9"
          iconSize={16}
          onClick={onClick}
        />
      </div>

      <p className="flex-1 px-3 text-dg">{convertUTCToKSTDate(data.date)}</p>
      <p
        className="flex-[0.5] px-3 text-dg truncate min-w-0"
        title={data.quantity.toLocaleString()}
      >
        {data.quantity.toLocaleString()}
      </p>
      <p
        className="flex-[0.5] px-3 text-dg truncate min-w-0"
        title={data.unit_price.toLocaleString()}
      >
        {data.unit_price.toLocaleString()}
      </p>
      <p
        className="flex-[0.5] px-3 text-dg truncate min-w-0"
        title={data.amount.toLocaleString()}
      >
        {data.amount.toLocaleString()}
      </p>
    </div>
  );
};

export default QuotationHistoryItem;
