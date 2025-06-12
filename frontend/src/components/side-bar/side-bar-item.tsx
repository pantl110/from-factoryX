"use client";

import { IconProps } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";

interface SideBarItemProps {
  icon: React.ComponentType<IconProps>;
  label: string;
  path: string;
}

const SideBarItem = ({ icon: Icon, label, path }: SideBarItemProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === path;

  const handleClick = () => {
    router.push(path);
  };

  return (
    <div
      className="flex items-center justify-between h-[52px] px-4 py-1 bg-wh hover:bg-transparent rounded cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <Icon size={20} className={isActive ? "text-primary" : "text-gr"} />
        <p className={`Heading-4 ${isActive ? "text-bl" : "text-dg"}`}>
          {label}
        </p>
      </div>
      <div className=""></div>
    </div>
  );
};

export default SideBarItem;
