import clsx from 'clsx';
import { chipColorClasses, ChipColor } from './chip-colors';

interface RoundChipProps {
  text: string;
  variant: 'default' | 'defaultSmall' | 'sm' | 'role';
  color: ChipColor;
}

const colorClasses = chipColorClasses;

const sizeClasses = {
  default: 'px-4 h-[36px] Me_body-1',
  defaultSmall: 'px-2.5 h-[30.5px] Re_body-2',
  sm: 'px-2.5 h-[26px] Re_body-2',
  role: 'px-2 h-[20px] Re_body-3',
} as const;

export const RoundChip = ({ text, variant, color }: RoundChipProps) => {
  return (
    <div
      className={clsx(
        'rounded-full w-fit flex items-center justify-center',
        colorClasses[color],
        sizeClasses[variant]
      )}
    >
      <span>{text}</span>
    </div>
  );
};
