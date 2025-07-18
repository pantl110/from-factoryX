import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { Plus } from '@phosphor-icons/react';

interface StockLocationItemProps {
  onDelete?: () => void;
  onPlusClick?: () => void;
}

const StockLocationItem = ({
  onDelete,
  onPlusClick,
}: StockLocationItemProps) => {
  return (
    <div className="p-4 flex flex-col gap-4 rounded-[8px] border border-lg ">
      <Input
        placeholder="품목이 있는 창고 위치를 입력하세요."
        label="창고 위치"
      />
      <div className="flex justify-between items-end">
        <div
          className="w-20 h-20 bg-primary-8 flex items-center justify-center rounded-[8px] cursor-pointer"
          onClick={onPlusClick}
        >
          <Plus size={24} className="text-primary" />
        </div>
        {onDelete && (
          <MiniBtn
            text="삭제"
            textColor="text-red"
            bgColor="bg-red-8"
            hoverColor="hover:bg-red-hover"
            onClick={onDelete}
          />
        )}
      </div>
    </div>
  );
};

export default StockLocationItem;
