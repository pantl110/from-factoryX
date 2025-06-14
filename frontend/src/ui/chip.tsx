interface ChipProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  containerWidth?: string;
  sm?: boolean;
  radius?: string;
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
  onClick,
}: ChipProps) => {
  return (
    <div className={`${containerWidth}`}>
      <div
        className={`flex items-center px-3 w-fit ${radius} Me_Body-1 ${bgColor} ${textColor} ${
          sm ? "h-7" : "h-9"
        } ${borderColor ? `border ${borderColor}` : ""} ${onClick ? "cursor-pointer" : ""}`}
        onClick={onClick}
      >
        {text}
      </div>
    </div>
  );
};

export default Chip;
