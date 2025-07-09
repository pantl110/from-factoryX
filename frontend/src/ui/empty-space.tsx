interface EmptySpaceProps {
  title: string;
  description: string;
  height?: string;
  className?: string;
}

const EmptySpace = ({
  title,
  description,
  height,
  className,
}: EmptySpaceProps) => {
  return (
    <div
      className={`flex flex-col gap-1 items-center justify-center ${height} border border-[#E4E4E7] rounded-[4px] ${className}`}
    >
      <h4 className="text-dg Heading-4">{title}</h4>
      <p className="text-gr Re_Body-1">{description}</p>
    </div>
  );
};

export default EmptySpace;
