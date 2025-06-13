"use client";

import { IconProps } from "@phosphor-icons/react";
import { log } from "console";

interface MiniBtnProps {
  text: string;
  textColor?: string;
  bgColor?: string;
  hoverColor?: string;
  borderColor?: string;
  icon?: React.ComponentType<IconProps>;
  iconColor?: string;
  onClick?: () => void;
}

const MiniBtn = ({
  text,
  textColor,
  bgColor = "bg-transparent",
  hoverColor,
  borderColor,
  icon: Icon,
  iconColor,
  onClick,
}: MiniBtnProps) => {
  const borderClass = borderColor ? `border ${borderColor}` : "";
  const hoverClass = hoverColor ? `hover:${hoverColor}` : "";

  return (
    <button
      className={`h-10 px-4 py-2 rounded-md Me_Body-1 ${bgColor} ${textColor} ${borderClass} ${hoverClass} flex items-center gap-2 cursor-pointer`}
      onClick={onClick}
    >
      {Icon && <Icon size={20} className={iconColor} />}
      <span>{text}</span>
    </button>
  );
};

export default MiniBtn;
