interface NoHistoryBoxProps {
  title: string;
  text: string;
}

const NoHistoryBox = ({ title, text }: NoHistoryBoxProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-[210px] gap-2 rounded-sm border border-[#E4E4E7]">
      <h4 className="Heading-4 text-dg">{title}</h4>
      <p className="Re_Body-1 text-gr">{text}</p>
    </div>
  );
};

export default NoHistoryBox;
