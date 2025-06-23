import Chip from "@/ui/chip";

const ProcessProjectItem = () => {
  return (
    <div className="flex flex-col gap-4 w-[293px] p-4 border rounded-lg border-[#eeeeee]">
      <div className="flex flex-col gap-1">
        <h4 className="Heading-4">플라스틱이 좋아</h4>
        <div className="Me_Body-1 text-sv">
          <span>납기일자</span>
          <span className="text-gr"> | </span>
          <span>2025-06-15</span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-1 text-dg">3일 전</p>
        <Chip text="생산 중" bgColor="bg-purple-8" textColor="text-purple" />
      </div>
    </div>
  );
};

export default ProcessProjectItem;
