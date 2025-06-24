import Input from "@/ui/input";

const MaterialInputItem = () => {
  return (
    <div className="w-[736px] flex flex-col gap-3 p-5 border border-lg rounded-xl shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <div className="flex gap-2.5 flex-1">
        <div className="flex-2">
          <Input
            label="자재명"
            type="text"
            placeholder="자재명 입력"
            required={true}
          />
        </div>
        <div className="flex-2">
          <Input
            label="규격"
            type="text"
            placeholder="규격 입력"
            required={true}
          />
        </div>
        <div className="flex-1">
          <Input
            label="사용 수량"
            type="text"
            placeholder="EX) 100"
            required={true}
          />
        </div>
      </div>
    </div>
  );
};

export default MaterialInputItem;
