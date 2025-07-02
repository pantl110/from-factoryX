import { NoteBlankIcon } from "@phosphor-icons/react/dist/ssr";

const TimelineItem = () => {
  return (
    <div className="border border-[#eeeeee] rounded-lg p-3">
      <div className="flex flex-col gap-5 px-1">
        <div className="flex gap-2">
          <div className="w-6 h-6">
            <NoteBlankIcon size={24} className="text-sv" />
          </div>
          <h4 className="Heading-4 text-dg">설비 문제</h4>
        </div>
        <div className="flex w-full items-center justify-between text-sv">
          <p className="Me_Body-2 text-sv">설비가 이상하다. 한 번 확인 필요!</p>
          <p className="flex items-end Re_Body-1 text-sv">3시간 전</p>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
