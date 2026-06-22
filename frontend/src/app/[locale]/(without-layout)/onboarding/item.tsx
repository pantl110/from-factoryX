import { X } from '@phosphor-icons/react';

interface ItemProps {
  material: string;
}

const Item = ({ material }: ItemProps) => {
  return (
    <div className="h-[52px] flex gap-2.5 px-2 items-center justify-between">
      <span className="Me_Body-3 text-dg">{material}</span>
      <div className="px-2">
        <X size={16} className="text-dg" />
      </div>
    </div>
  );
};

export default Item;
