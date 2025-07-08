import { ReactNode } from "react";

interface DropdownItemProps {
  icon?: ReactNode;
  text?: string;
  textColor?: string;
  onClick?: (e?: React.MouseEvent) => void;
  children?: ReactNode;
  noHover?: boolean;
  chip?: boolean;
}

const DropdownItem = ({
  text,
  icon,
  textColor = "text-dg",
  onClick,
  children,
  noHover = false,
  chip = false,
}: DropdownItemProps) => {
  return (
    <div
      className={`bg-wh flex gap-3 w-full ${chip ? "h-fit" : "h-12"} items-center cursor-pointer rounded-[4px] ${
        chip ? "p-0" : "p-2"
      } transition-all duration-200 ease-in-out ${
        noHover ? "" : "hover:bg-bg"
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
          className={`Heading-4 ${textColor} transition-colors duration-200 ease-in-out`}
        >
          {text}
        </h4>
      )}
      {children}
    </div>
  );
};

export default DropdownItem;
