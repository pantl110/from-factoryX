interface ChipProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  containerWidth?: string;
}

const Chip = ({ text, bgColor, textColor, containerWidth }: ChipProps) => {
  return (
    <div className={`${containerWidth}`}>
      <div
        className={`flex items-center px-3 w-fit rounded Sm_Heading-2 ${bgColor} ${textColor} h-9`}
      >
        {text}
      </div>
    </div>
  );
};

export default Chip;
