import { ReactNode } from "react";

interface DropdownItemProps {
  icon?: ReactNode;
  text: string;
  textColor?: string;
  onClick?: () => void;
}

const DropdownItem = ({
  text,
  icon,
  textColor = "text-dg",
  onClick,
}: DropdownItemProps) => {
  return (
    <div
      className="flex gap-3 w-full h-12 items-center cursor-pointer rounded-[4px] p-2 hover:bg-bg"
      onClick={onClick}
    >
      {icon && (
        <div className="flex items-center justify-center w-6 h-6 text-gr">
          {icon}
        </div>
      )}
      <h4 className={`Heading-4 ${textColor}`}>{text}</h4>
    </div>
  );
};

export default DropdownItem;
