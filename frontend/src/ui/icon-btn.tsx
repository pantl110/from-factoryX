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
  hoverBg?: boolean;
  hoverText?: string | boolean;
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
  hoverBg = true,
  hoverText = false,
}: IconBtnProps) => {
  return (
    <button
      className={`group ${className} shrink-0 flex items-center justify-center ${size} ${rounded} ${hoverBg && 'hover:bg-bg'} transition-colors duration-200 ${groupHover ? `opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out` : ''}`}
      onClick={onClick}
    >
      <Icon
        size={iconSize}
        className={
          iconColor +
          ' ' +
          (hoverText
            ? typeof hoverText === 'string'
              ? `group-hover:${hoverText.replace(/^(hover:|group-hover:)/, '')}`
              : 'group-hover:text-red'
            : '')
        }
      />
    </button>
  );
};

export default IconBtn;
