interface ChipProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  containerWidth?: string;
  sm?: boolean;
  radius?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const Chip = ({
  text,
  bgColor,
  textColor,
  borderColor,
  containerWidth,
  sm = false,
  radius = "rounded",
  icon,
  onClick,
}: ChipProps) => {
  return (
    <div
      className={`${containerWidth}`}
      onClick={onClick}
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
        className={`flex gap-1 items-center w-fit ${radius} Me_Body-1 ${bgColor} ${textColor} ${
          sm ? "h-7 px-2" : "h-9 px-3"
        } ${borderColor ? `border ${borderColor}` : ""}`}
      >
        <p>{text}</p>
        {icon}
      </div>
    </div>
  );
};

export default Chip;
