"use client";

import { IconProps } from "@phosphor-icons/react";

interface MiniBtnProps {
  text: string;
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  icon?: React.ComponentType<IconProps>;
  iconColor?: string;
  onClick?: () => void;
}

const MiniBtn = ({
  text,
  textColor,
  bgColor = "bg-transparent",
  borderColor,
  icon: Icon,
  iconColor,
  onClick,
}: MiniBtnProps) => {
  const borderClass = borderColor ? `border ${borderColor}` : "";

  return (
    <button
      className={`h-10 px-4 py-2 rounded-md Sm_Heading-2 ${bgColor} ${textColor} ${borderClass} flex items-center gap-2`}
      onClick={onClick}
    >
      {Icon && <Icon size={20} className={iconColor} />}
      <span>{text}</span>
    </button>
  );
};

export default MiniBtn;
