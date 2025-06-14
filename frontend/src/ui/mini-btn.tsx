"use client";

import { IconProps } from "@phosphor-icons/react";

interface MiniBtnProps {
  text: string;
  textColor?: string;
  bgColor?: string;
  hoverColor?: string;
  borderColor?: string;
  icon?: React.ComponentType<IconProps>;
  iconColor?: string;
  onClick?: () => void;
  height?: number;
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
  height = 40,
}: MiniBtnProps) => {
  const borderClass = borderColor ? `border ${borderColor}` : "";
  const hoverClass = hoverColor ? `hover:${hoverColor}` : "";

  return (
    <button
      className={`px-4 py-2 rounded-md Me_Body-1 ${bgColor} ${textColor} ${borderClass} ${hoverClass} flex items-center justify-center gap-2 cursor-pointer`}
      style={{ height: `${height}px` }}
      onClick={onClick}
    >
      {Icon && <Icon size={20} className={iconColor} />}
      <span>{text}</span>
    </button>
  );
};

export default MiniBtn;
