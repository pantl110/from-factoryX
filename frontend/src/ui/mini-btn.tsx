"use client";

import { IconProps } from "@phosphor-icons/react";
import { ButtonHTMLAttributes } from "react";

interface MiniBtnProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  > {
  text: string;
  textColor?: string;
  bgColor?: string;
  hoverColor: string;
  borderColor?: string;
  icon?: React.ComponentType<IconProps>;
  iconPosition?: "left" | "right";
  iconColor?: string;
  width?: string;
  height?: string;
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
  width = "w-fit",
  height = "h-10",
  ...rest
}: MiniBtnProps) => {
  const borderClass = borderColor ? `border ${borderColor}` : "";
  const positionClass = iconPosition === "right" ? "flex-row-reverse" : "";

  return (
    <button
      className={`px-4 rounded-md Me_Body-1 ${height} ${width} transition-all duration-200 ease-in-out ${
        rest.disabled
          ? "bg-lg text-gr"
          : `${bgColor} ${textColor} ${hoverColor || ""}`
      } ${borderClass} flex items-center justify-center gap-2 ${positionClass} ${
        rest.disabled ? "cursor-not-allowed" : "cursor-pointer"
      } transition-colors duration-200`}
      {...rest}
    >
      {Icon && (
        <Icon
          size={20}
          className={`transition-colors duration-200 ease-in-out ${rest.disabled ? "text-gr" : iconColor}`}
        />
      )}
      <span>{text}</span>
    </button>
  );
};

export default MiniBtn;
