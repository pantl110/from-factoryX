interface NoHistoryBoxProps {
  title: string;
  text: string;
}

const NoHistoryBox = ({ title, text }: NoHistoryBoxProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-50 gap-2 rounded-sm border border-lg w-full">
      <h4 className="Heading-4 text-dg">{title}</h4>
      <p className="Re_Body-1 text-gr">{text}</p>
    </div>
  );
};

export default NoHistoryBox;
