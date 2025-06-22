import { ReactNode } from "react";

interface DropdownItemProps {
  icon?: ReactNode;
  text: string;
}

const DropdownItem = ({ text, icon }: DropdownItemProps) => {
  return (
    <div className="flex gap-3 h-10 items-center cursor-pointer">
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
