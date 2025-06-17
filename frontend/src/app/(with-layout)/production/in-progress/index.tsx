import ProductFlowTitle from "./product-flow-title";
import InProgressTableHeader from "./in-progress-table-header";
import InProgressTableItem from "./in-progress-table-item";

const InProgressPage = () => {
  return (
    <>
      <ProductFlowTitle />
      <div className="px-10 pt-5 pb-9">
        <InProgressTableHeader />
        <InProgressTableItem />
        <InProgressTableItem />
        <InProgressTableItem />
        <InProgressTableItem />
        <InProgressTableItem />
        <InProgressTableItem />
        <InProgressTableItem />
        <InProgressTableItem />
        <InProgressTableItem />
        <InProgressTableItem />
      </div>
    </>
  );
};

export default InProgressPage;
