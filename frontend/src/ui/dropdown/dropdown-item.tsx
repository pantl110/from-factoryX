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
}: DropdownItemProps) => {
  return (
    <div
      className={`truncate bg-wh flex gap-3 w-full ${chip ? 'h-fit' : search ? 'h-10' : mobile ? 'h-[43px]' : 'h-12'} items-center cursor-pointer rounded-[4px] p-0 transition-all duration-200 ease-in-out ${
        noHover ? '' : 'hover:bg-bg'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {icon && (
        <div className="flex items-center justify-center w-6 h-6 text-gr transition-colors duration-200 ease-in-out">
          {icon}
        </div>
      )}
      {text && (
        <h4
          className={`${search ? 'Me_Body-1' : mobile ? 'm-Heading-5c' : 'Heading-4'} ${textColor} transition-colors duration-200 ease-in-out ${search ? 'text-left pl-2' : mobile ? 'text-left pl-4' : 'pl-2'} w-full`}
        >
          {text}
        </h4>
      )}
      {children}
    </div>
  );
};

export default DropdownItem;
