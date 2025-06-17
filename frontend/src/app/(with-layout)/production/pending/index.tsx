import ProductFlowTitle from "./product-flow-title";
import PendingTableHeader from "./pending-table-header";
import PendingTableItem from "./pending-table-item";

const PendingPage = () => {
  return (
    <>
      <ProductFlowTitle />
      <div className="px-10 pt-5 pb-9">
        <PendingTableHeader />
        <PendingTableItem />
        <PendingTableItem />
        <PendingTableItem />
        <PendingTableItem />
        <PendingTableItem />
        <PendingTableItem />
        <PendingTableItem />
        <PendingTableItem />
        <PendingTableItem />
      </div>
    </>
  );
};

export default PendingPage;
