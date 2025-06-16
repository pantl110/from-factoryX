interface ChipProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  containerWidth?: string;
  sm?: boolean;
}

const Chip = ({
  text,
  bgColor,
  textColor,
  containerWidth,
  sm = false,
}: ChipProps) => {
  return (
    <div className={`${containerWidth}`}>
      <div
        className={`flex items-center w-fit rounded Me_Body-1 ${bgColor} ${textColor} ${
          sm ? "h-7 px-2" : "h-9 px-3"
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default Chip;
