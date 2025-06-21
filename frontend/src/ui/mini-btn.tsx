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
  disabled?: boolean;
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
  disabled = false,
}: MiniBtnProps) => {
  const borderClass = borderColor ? `border ${borderColor}` : "";

  return (
    <button
      className={`px-4 py-2 rounded-md Me_Body-1 ${
        disabled
          ? "bg-lg text-gr"
          : `${bgColor} ${textColor} ${hoverColor || ""}`
      } ${borderClass} flex items-center justify-center gap-2 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{ height: `${height}px` }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={20} className={disabled ? "text-gr" : iconColor} />}
      <span>{text}</span>
    </button>
  );
};

export default MiniBtn;
