import Chip from "@/ui/chip";

const PendingQuoteItem = () => {
  return (
    <div className="flex flex-col w-[453px] gap-2 p-4 border rounded border-[#eeeeee]">
      <div className="flex flex-col gap-2.5">
        <h4 className="Heading-4">알루미늄이 싫어!</h4>
        <div className="Me_Body-1 text-sv">
          <span>품목</span>
          <span className="text-gr"> | </span>
          <span>알루미늄 케이스 외 2건</span>
        </div>
      </div>
      <div className="flex items-center">
        <p className="flex-1 Me_Body-1 text-sv">2025-06-12</p>
        <Chip text="견적 협의" bgColor="bg-bg" textColor="text-bl" />
      </div>
    </div>
  );
};

export default PendingQuoteItem;
