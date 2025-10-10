import IconBtn from '@/ui/icon-btn';
import MoChip from '@/ui/mo-chip';
import { CaretRight } from '@phosphor-icons/react';

interface AlarmItemProps {
  chipText: string;
  chipVariant: 'secondary' | 'red-secondary' | 'outline';
  name: string;
  subText: string;
  subChipText?: string;
}

const AlarmItem = ({
  chipText,
  chipVariant,
  name,
  subText,
  subChipText,
}: AlarmItemProps) => {
  return (
    <div className="w-full flex justify-between items-center px-6 pt-4 pb-3 border-b border-bg">
      <div className="flex flex-col gap-1.5">
        <MoChip text={chipText} variant={chipVariant} info={true} />
        <h4 className="m-Heading-5c text-dg">{name}</h4>
        <h6 className="m-Info text-sv">{subText}</h6>
        {subChipText && <MoChip text={subChipText} variant="outline" />}
      </div>
      <IconBtn
        icon={CaretRight}
        iconSize={18}
        iconColor="text-gr"
        size="w-5 h-5"
        onClick={() => {}}
      />
    </div>
  );
};

export default AlarmItem;
