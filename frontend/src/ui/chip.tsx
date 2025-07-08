import { CaretDown } from "@phosphor-icons/react";

interface ChipProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  containerWidth?: string;
  state?: boolean;
  radius?: string;
  onClick?: (e?: React.MouseEvent) => void;
  cursor?: string;
  hover?: string;
}

const Chip = ({
  text,
  bgColor,
  textColor,
  borderColor,
  containerWidth,
  state = false,
  radius = "rounded",
  onClick,
  cursor = onClick ? "cursor-pointer" : "",
  hover = "",
}: ChipProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <div
      className={`${containerWidth}`}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div
        className={`flex gap-1 items-center w-fit h-8 px-3 ${radius} Me_Body-1 ${bgColor} ${textColor} ${cursor} ${hover} ${borderColor ? `border ${borderColor}` : ""} ${
          state ? "cursor-pointer" : ""
        }`}
      >
        <span>{text}</span>
        {state && <CaretDown size={12} />}
      </div>
    </div>
  );
};

export default Chip;
