import { IconProps } from "@phosphor-icons/react";

interface SideBarItemProps {
  icon: React.ComponentType<IconProps>;
  label: string;
}

const SideBarItem = ({ icon: Icon, label }: SideBarItemProps) => {
  return (
    <div className="flex items-center justify-between h-[52px] px-4 py-1 bg-wh hover:bg-transparent rounded">
      <div className="flex items-center gap-2">
        <Icon size={20} className="text-gr" />
        <p className="Heading-4 text-dg">{label}</p>
      </div>
      <div className=""></div>
    </div>
  );
};

export default SideBarItem;
