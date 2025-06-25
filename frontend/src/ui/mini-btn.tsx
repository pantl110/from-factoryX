"use client";

import { IconProps } from "@phosphor-icons/react";

interface MiniBtnProps {
  text: string;
  textColor?: string;
  bgColor?: string;
  hoverColor: string;
  borderColor?: string;
  icon?: React.ComponentType<IconProps>;
  iconPosition?: "left" | "right";
  iconColor?: string;
  onClick?: () => void;
  height?: string;
  disabled?: boolean;
}

const MiniBtn = ({
  text,
  textColor,
  bgColor = "bg-transparent",
  hoverColor,
  borderColor,
  icon: Icon,
  iconPosition = "left",
  iconColor,
  onClick,
  height = "h-10",
  disabled = false,
}: MiniBtnProps) => {
  const borderClass = borderColor ? `border ${borderColor}` : "";
  const positionClass = iconPosition === "right" ? "flex-row-reverse" : "";

  return (
    <button
      className={`px-4 rounded-md Me_Body-1 ${height} ${
        disabled
          ? "bg-lg text-gr"
          : `${bgColor} ${textColor} ${hoverColor || ""}`
      } ${borderClass} flex items-center justify-center gap-2 ${positionClass} ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={20} className={disabled ? "text-gr" : iconColor} />}
      <span>{text}</span>
    </button>
  );
};

export default MiniBtn;
