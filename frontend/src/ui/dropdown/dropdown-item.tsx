import { ReactNode } from "react";

interface DropdownItemProps {
  icon?: ReactNode;
  text: string;
  onClick?: () => void;
}

const DropdownItem = ({ text, icon, onClick }: DropdownItemProps) => {
  return (
    <div
      className="flex gap-3 w-full h-10 items-center cursor-pointer rounded-lg p-2 hover:bg-bg"
      onClick={onClick}
    >
      {icon && (
        <div className="flex items-center justify-center w-6 h-6 text-gr">
          {icon}
        </div>
      )}
      <h4 className="Heading-4 text-dg">{text}</h4>
    </div>
  );
};

export default DropdownItem;
