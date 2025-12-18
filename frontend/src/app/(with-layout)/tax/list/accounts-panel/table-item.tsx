import { RoundChip } from '@/ui';

const TableItem = () => {
  return (
    <div className="flex items-center border-b border-lg h-14 w-full text-bl Me_Body-1">
      <p className="flex-1 px-3 text-dg truncate" title="2025-12-17">
        2025-12-17
      </p>
      <p className="flex-1 px-3 text-dg truncate" title="15,000원">
        15,000원
      </p>
      <p className="flex-1 px-3 text-dg truncate" title="15,000원">
        15,000원
      </p>

      <p className="flex-1 px-3 text-red truncate" title="20일">
        20일
      </p>
    </div>
  );
};

export default TableItem;
