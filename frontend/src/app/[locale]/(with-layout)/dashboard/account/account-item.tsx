import { RoundChip } from '@/ui';

interface AccountItemProps {
  chipText: string;
  chipColor: 'red' | 'secondary';
  description: string;
  date: string;
  isOverdue?: boolean;
  onClick?: () => void;
}

const AccountItem = ({
  chipText,
  chipColor,
  description,
  date,
  isOverdue = false,
  onClick,
}: AccountItemProps) => {
  return (
    <div
      className="flex items-center justify-between border border-lg rounded-sm py-3 px-5 w-full h-14 cursor-pointer hover:bg-bg transition-colors ease-in-out duration-200"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 w-full">
        <div className="flex items-center justify-start flex-shrink-0 w-[80px]">
          <RoundChip text={chipText} variant="sm" color={chipColor} />
        </div>
        <p
          className="Me_Body-2 text-dg truncate flex-1 min-w-0"
          title={description}
        >
          {description}
        </p>
        <p
          className={`pl-4 Me_Body-2 flex-shrink-0 w-fit text-right ${
            isOverdue ? 'text-red' : 'text-gr'
          }`}
        >
          {date}
        </p>
      </div>
    </div>
  );
};

export default AccountItem;
