"use client";

import { IconProps } from "@phosphor-icons/react";
import { CaretDown } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface DropdownItemProps {
  label: string;
  path: string;
}

interface SideBarItemProps {
  icon: React.ComponentType<IconProps>;
  label: string;
  path: string;
  hasDropdown?: boolean;
  dropdownItems?: DropdownItemProps[];
}

const SideBarItem = ({
  icon: Icon,
  label,
  path,
  hasDropdown = false,
  dropdownItems = [],
}: SideBarItemProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive =
    pathname === path ||
    (hasDropdown && dropdownItems.some((item) => pathname === item.path));

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleClick = () => {
    if (hasDropdown) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      router.push(path);
    }
  };

  const handleDropdownItemClick = (itemPath: string) => {
    router.push(itemPath);
  };

  return (
    <div>
      <button
        className="flex items-center justify-between h-[52px] px-4 bg-wh hover:bg-bg rounded cursor-pointer w-full"
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          <Icon size={20} className={isActive ? "text-primary" : "text-gr"} />
          <p className={`Heading-4 ${isActive ? "text-bl" : "text-sv"}`}>
            {label}
          </p>
        </div>
        <div>
          {hasDropdown && (
            <CaretDown
              size={20}
              className={`text-dg transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </button>

      {hasDropdown && isDropdownOpen && (
        <div className="flex gap-4 flex-col ml-[28px] mt-2">
          {dropdownItems.map((item, index) => (
            <button
              key={index}
              className="flex items-center px-4 cursor-pointer w-full text-left"
              onClick={() => handleDropdownItemClick(item.path)}
            >
              <p
                className={`Me_Body-1 text-dg ${pathname === item.path ? "text-primary" : ""}`}
              >
                {item.label}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SideBarItem;
