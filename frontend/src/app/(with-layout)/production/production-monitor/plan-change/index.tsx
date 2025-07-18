interface PlanChangeSectionProps {
  title: string;
  content: string;
}

const PlanChangeSection = ({ title, content }: PlanChangeSectionProps) => {
  return (
    <div className="rounded flex flex-col gap-4 h-full pb-10">
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex gap-2">
          <div className="h-11 px-3 w-[110px] Me_Body-1 bg-bg flex items-center justify-center rounded">
            계획 변경
          </div>
          <div className="h-11 border px-3 Re_Body-1 text-dg border-[#E4E4E7] flex items-center rounded-lg flex-1">
            {title}
          </div>
        </div>
        <div className="border px-3 Re_Body-1 text-dg border-[#E4E4E7] min-h-8 rounded-lg py-5 flex-1">
          {content}
        </div>
      </div>
    </div>
  );
};

export default PlanChangeSection;
