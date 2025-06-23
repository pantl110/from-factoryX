import Chip from "@/ui/chip";

const ProductionTableItem = () => {
  return (
    <div className="flex w-full h-14 items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <div className="flex items-center py-1 px-3 w-[150px]">
        <Chip text="생산완료" textColor="text-primary" bgColor="bg-primary-8" />
      </div>
      <p className="py-1 px-3 flex-1">1호기</p>
      <p className="py-1 px-3 flex-1">플라스틱 컵</p>
      <p className="py-1 px-3 flex-1">200</p>
      <p className="py-1 px-3 w-[80px]">EA</p>
      <p className="flex items-center py-1 px-3 w-[200px]">09:00-13:00</p>
      <p className="py-1 px-3 w-[200px]">[보기]</p>
    </div>
  );
};

export default ProductionTableItem;
