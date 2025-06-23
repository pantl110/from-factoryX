import { CubeFocus, NoteBlankIcon, Swap } from "@phosphor-icons/react/dist/ssr";
import { LogType } from "@/mocks/log-data";

interface LogItemProps {
  type: LogType;
  title: string;
  content: string;
  createdAt: string;
  onClick?: () => void;
  isSelected?: boolean;
}

const LogItem = ({
  type,
  title,
  content,
  createdAt,
  onClick,
  isSelected,
}: LogItemProps) => {
  const icon = {
    memo: (
      <NoteBlankIcon
        size={24}
        className={`${isSelected ? "text-primary" : "text-sv"}`}
        weight={isSelected ? "fill" : "regular"}
      />
    ),
    return: (
      <Swap
        size={24}
        className={`${isSelected ? "text-primary" : "text-sv"}`}
        weight={isSelected ? "fill" : "regular"}
      />
    ),
    planChange: (
      <CubeFocus
        size={24}
        className={`${isSelected ? "text-primary" : "text-sv"}`}
        weight={isSelected ? "fill" : "regular"}
      />
    ),
  };

  return (
    <div
      className={`border border-[#eeeeee] rounded-lg p-3 ${isSelected ? "bg-primary-8" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      <div className="flex flex-col gap-5 px-1">
        <div className="flex gap-2">
          <div className="w-6 h-6">{icon[type]}</div>
          <h4 className="Heading-4 text-dg">{title}</h4>
        </div>
        <div className="flex w-full items-center justify-between text-sv">
          <p className="Me_Body-2 text-sv">{content}</p>
          <p className="flex items-end Re_Body-1 text-sv">{createdAt}</p>
        </div>
      </div>
    </div>
  );
};

export default LogItem;
