import { ComponentType } from 'react';
import { IconProps } from '@phosphor-icons/react';

interface IconBtnProps {
  icon: ComponentType<IconProps>;
  size?: string;
  onClick: () => void;
}

const IconBtn = ({ icon: Icon, onClick, size = 'w-9 h-9' }: IconBtnProps) => {
  return (
    <button
      className={`flex items-center justify-center ${size} rounded-[8px] hover:bg-bg transition-colors duration-200`}
      onClick={onClick}
    >
      <Icon size={24} className="text-sv" />
    </button>
  );
};

export default IconBtn;
