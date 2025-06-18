import TableHeader from "./table-header";
import TableItem from "./table-item";

const ProductionPlan = () => {
  return (
    <div className="w-full overflow-x-auto px-10 pt-5 pb-9">
      <TableHeader />
      <TableItem operationStatus="가동대기" materialStatus="충분" />
      <TableItem operationStatus="가동중" materialStatus="부족" />
      <TableItem operationStatus="가동완료" materialStatus="충분" />
      <TableItem operationStatus="가동대기" materialStatus="부족" />
      <TableItem operationStatus="가동중" materialStatus="충분" />
      <TableItem operationStatus="가동완료" materialStatus="부족" />
      <TableItem operationStatus="가동대기" materialStatus="충분" />
      <TableItem operationStatus="가동중" materialStatus="부족" />
      <TableItem operationStatus="가동완료" materialStatus="충분" />
      <TableItem operationStatus="가동대기" materialStatus="부족" />
    </div>
  );
};

export default ProductionPlan;
