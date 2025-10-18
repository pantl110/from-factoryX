import { ComponentType } from 'react';
import { IconProps } from '@phosphor-icons/react';

interface IconBtnProps {
  icon: ComponentType<IconProps>;
  size?: string;
  iconSize?: number;
  iconColor?: string;
  onClick: () => void;
  className?: string;
  groupHover?: boolean;
  rounded?: string;
}

const IconBtn = ({
  icon: Icon,
  onClick,
  size = 'w-9 h-9',
  iconSize = 24,
  className,
  groupHover,
  iconColor = 'text-sv',
  rounded = 'rounded-[8px]',
}: IconBtnProps) => {
  return (
    <button
      className={`${className} shrink-0 flex items-center justify-center ${size} ${rounded} hover:bg-bg transition-colors duration-200 ${groupHover ? `opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out` : ''}`}
      onClick={onClick}
    >
      <Icon size={iconSize} className={iconColor} />
    </button>
  );
};

export default IconBtn;
