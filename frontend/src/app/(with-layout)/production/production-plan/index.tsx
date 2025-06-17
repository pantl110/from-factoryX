import TableHeader from "./TableHeader";
import TableItem from "./TableItem";

const ProductionPlan = () => {
  return (
    <div className="px-10 pt-5 pb-9">
      <TableHeader />
      <TableItem operationStatus="가동 대기" materialStatus="충분" />
      <TableItem operationStatus="가동 중" materialStatus="부족" />
      <TableItem operationStatus="가동 완료" materialStatus="충분" />
      <TableItem operationStatus="가동 대기" materialStatus="부족" />
      <TableItem operationStatus="가동 중" materialStatus="충분" />
      <TableItem operationStatus="가동 완료" materialStatus="부족" />
      <TableItem operationStatus="가동 대기" materialStatus="충분" />
      <TableItem operationStatus="가동 중" materialStatus="부족" />
      <TableItem operationStatus="가동 완료" materialStatus="충분" />
      <TableItem operationStatus="가동 대기" materialStatus="부족" />
    </div>
  );
};

export default ProductionPlan;
