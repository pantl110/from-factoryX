import clsx from 'clsx';

interface RoundChipProps {
  text: string;
  variant: 'sm';
  color:
    | 'primary'
    | 'secondary'
    | 'red'
    | 'green'
    | 'orange'
    | 'yellow'
    | 'purple'
    | 'gray';
}

const colorClasses = {
  primary: 'bg-primary text-wh',
  secondary: 'bg-primary-8 text-primary',
  red: 'bg-red-8 text-red',
  green: 'bg-green-8 text-green',
  orange: 'bg-orange-8 text-orange',
  yellow: 'bg-yellow-8 text-yellow',
  purple: 'bg-purple-8 text-purple',
  gray: 'bg-bg text-dg',
} as const;

const sizeClasses = {
  sm: 'px-2.5 h-[26px] Re_Body-2',
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
      {text}
    </div>
  );
};
