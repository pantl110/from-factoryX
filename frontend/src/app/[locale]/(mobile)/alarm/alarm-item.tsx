import MoChip from '@/ui/mo-chip';
import { CaretRight } from '@phosphor-icons/react';

interface AlarmItemProps {
  chipText: string;
  chipVariant: 'secondary' | 'red-secondary' | 'outline';
  name: string;
  subText: string;
  subChipText?: string;
  onClick: () => void;
}

const AlarmItem = ({
  chipText,
  chipVariant,
  name,
  subText,
  subChipText,
  onClick,
}: AlarmItemProps) => {
  return (
    <button
      className="w-full flex justify-between items-center px-6 pt-4 pb-3 border-b border-bg"
      onClick={onClick}
    >
      <div className="flex flex-col gap-1.5 justify-start">
        <MoChip text={chipText} variant={chipVariant} info />
        <h4 className="m-Heading-5c text-dg text-start">{name}</h4>
        <h6 className="m-Info text-sv text-start">{subText}</h6>
        {subChipText && <MoChip text={subChipText} variant="outline" info />}
      </div>
      <CaretRight size={18} className="text-gr" />
    </button>
  );
};

export default AlarmItem;
