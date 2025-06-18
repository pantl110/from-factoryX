import Chip from "@/ui/chip";

const ProductionLogTableItem = () => {
  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1 text-dg">
      <p className="flex-1 py-1 px-3">P-001</p>
      <p className="flex-[2] py-1 px-3">플라스틱 컵</p>
      <p className="flex-1 py-1 px-3">500ml</p>
      <p className="w-[80px] py-1 px-3">EA</p>
      <p className="flex-1 py-1 px-3">5,000</p>
      <p className="flex-1 py-1 px-3">5,025</p>
      <p className="flex-1 py-1 px-3">1호기</p>
      <p className="flex-1 py-1 px-3">-</p>
      <div className="flex-1 py-1 px-3">
        <Chip text="충분" textColor="text-primary" bgColor="bg-primary-8" />
      </div>
      <p className="flex-1 py-1 px-3">김민수</p>
    </div>
  );
};

export default ProductionLogTableItem;
