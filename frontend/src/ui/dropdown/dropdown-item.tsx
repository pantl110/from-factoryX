import { ReactNode } from 'react';

interface DropdownItemProps {
  icon?: ReactNode;
  text?: string;
  textColor?: string;
  onClick?: (e?: React.MouseEvent) => void;
  children?: ReactNode;
  noHover?: boolean;
  chip?: boolean;
  search?: boolean;
  mobile?: boolean;
  breakWords?: boolean;
}

const DropdownItem = ({
  text,
  icon,
  textColor = 'text-dg',
  onClick,
  children,
  noHover = false,
  chip = false,
  search = false,
  mobile = false,
  breakWords = false,
}: DropdownItemProps) => {
  return (
    <div
      className={`${breakWords ? 'break-words' : 'truncate'} bg-wh flex gap-3 w-full ${chip ? 'h-fit' : breakWords ? 'h-fit min-h-12' : search ? 'h-10' : mobile ? 'h-[43px]' : 'h-12'} items-center cursor-pointer rounded-[4px] ${breakWords ? 'py-3' : 'p-0'} transition-all duration-200 ease-in-out ${
        noHover ? '' : 'hover:bg-bg'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {icon && (
        <div className="flex items-center justify-center w-6 h-6 text-gr transition-colors duration-200 ease-in-out flex-shrink-0">
          {icon}
        </div>
      )}
      {children}
      {text && (
        <h4
          className={`${search ? 'Me_Body-3' : mobile ? 'm-Heading-5c' : 'Heading-4'} ${textColor} transition-colors duration-200 ease-in-out ${search ? 'text-left px-2' : mobile ? 'text-left px-4' : 'px-4'} w-full min-w-0 ${breakWords ? 'break-words' : ''}`}
        >
          {text}
        </h4>
      )}
    </div>
  );
};

export default DropdownItem;
