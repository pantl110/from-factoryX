import MiniBtn from './mini-btn';

interface NoHistoryBoxProps {
  title?: string;
  text: string;
  height?: string;
  button?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const NoHistoryBox = ({
  title,
  text,
  height,
  button,
  onClick,
  disabled,
}: NoHistoryBoxProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-sm border border-lg w-full ${
        height ? `${height}` : 'h-50'
      }`}
    >
      {title && <h4 className="Heading-4 text-dg">{title}</h4>}
      <p className="Re_Body-1 text-gr">{text}</p>
      {button && (
        <MiniBtn
          text={button}
          variant="whiteOutline"
          onClick={onClick}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default NoHistoryBox;
