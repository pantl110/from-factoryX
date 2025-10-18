import { CaretDown } from '@phosphor-icons/react';

interface ChipProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  containerWidth?: string;
  state?: boolean;
  radius?: string;
  onClick?: (e?: React.MouseEvent) => void;
  cursor?: string;
  hover?: string;
  height?: string;
  padding?: string;
  width?: string;
  size?: 'default' | 'small' | 'role';
  textStyle?: string;
}

const Chip = ({
  text,
  bgColor,
  textColor,
  borderColor,
  containerWidth,
  state = false,
  radius = 'rounded',
  onClick,
  cursor = 'cursor-default',
  hover = '',
  height = 'h-8',
  padding = 'px-3',
  width = 'w-fit',
  size = 'default',
  textStyle = 'Me_Body-1',
}: ChipProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  // 사이즈별 스타일 설정
  const getSizeStyles = () => {
    if (size === 'small') {
      return {
        radius: 'rounded-[18px]',
        height: 'h-6.5',
        padding: 'px-2.5',
        textClass: 'Re_Body-2',
      };
    }
    if (size === 'role') {
      return {
        radius: 'rounded-full',
        height: 'h-5',
        padding: 'px-2',
        textClass: 'Heading-5b',
      };
    }
    return {
      radius,
      height,
      padding,
      textClass: textStyle,
    };
  };

  const sizeStyles = getSizeStyles();

  return (
    <div
      className={`${containerWidth}`}
      onClick={onClick ? handleClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div
        className={`flex gap-1 items-center justify-center ${width} ${sizeStyles.height} ${sizeStyles.padding} ${sizeStyles.radius} ${sizeStyles.textClass} ${bgColor} ${textColor} ${cursor} ${hover} ${borderColor ? `border ${borderColor}` : ''} ${
          state ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <span>{text}</span>
        {state && <CaretDown size={12} />}
      </div>
    </div>
  );
};

export default Chip;
