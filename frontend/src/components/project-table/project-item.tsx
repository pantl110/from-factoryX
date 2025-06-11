import Chip from "@/ui/chip";

const ProjectItem = () => {
  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee]">
      <div className="flex items-center py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>
      <div className="py-1 px-3">
        <Chip
          text="생산중"
          bgColor="bg-purple-8"
          textColor="text-purple"
          containerWidth="w-[150px]"
        />
      </div>
      <p className="flex-1 py-1 px-3 Me_Body-1 text-dg">플라스틱이 좋아</p>
      <p className="flex-1 py-1 px-3 Me_Body-1 text-dg">플라스틱 컵 외 3개</p>
      <p className="w-[200px] py-1 px-3 Me_Body-1 text-dg">2025-06-04</p>
      <p className="w-[200px] py-1 px-3 Me_Body-1 text-dg">2025-06-04</p>
    </div>
  );
};

export default ProjectItem;
