import clsx from 'clsx';

interface RoundChipProps {
  text: string;
  variant: 'default' | 'defaultSmall' | 'sm' | 'role';
  color:
    | 'red'
    | 'green'
    | 'orange'
    | 'yellow'
    | 'purple'
    | 'gray'
    | 'white'
    | 'whiteOutline'
    | 'blue';
}

const colorClasses = {
  red: 'bg-red-8 text-red',
  green: 'bg-green-8 text-green',
  orange: 'bg-orange-8 text-orange',
  yellow: 'bg-yellow-8 text-yellow',
  purple: 'bg-purple-8 text-purple',
  gray: 'bg-bg text-dg',
  white: 'bg-wh text-dg',
  whiteOutline: 'bg-wh text-dg border border-lg',
  blue: 'bg-blue-8 text-blue',
} as const;

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
