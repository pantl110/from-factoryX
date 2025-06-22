import { ReactNode } from "react";

interface DropdownProps {
  children: ReactNode;
}

const Dropdown = ({ children }: DropdownProps) => {
  return <div className="flex flex-col rounded-lg bg-wh p-2">{children}</div>;
};

export default Dropdown;
