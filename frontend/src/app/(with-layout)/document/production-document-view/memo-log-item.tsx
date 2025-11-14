interface MemoLogItemProps {
  memo?: string | null;
  time?: string;
}

const MemoLogItem = ({ memo, time }: MemoLogItemProps) => {
  return (
    <div className="pb-5 border-b border-lg mt-3">
      <div className="bg-bg rounded-[8px] py-3 px-4 flex flex-col gap-1">
        <div className="flex justify-between text-sv Me_Body-1">
          <span>변경 후</span>
          {time && <span>{time}</span>}
        </div>
        <p className="text-dg Me_Body-1 whitespace-pre-line">{memo || '-'}</p>
      </div>
    </div>
  );
};

export default MemoLogItem;
