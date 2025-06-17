import ProductFlowTitle from "./product-flow-title";
import CompletedTableHeader from "./completed-table-header";
import CompletedTableItem from "./completed-table-item";

const CompletedPage = () => {
  return (
    <>
      <ProductFlowTitle />
      <div className="px-10 pt-5 pb-9">
        <CompletedTableHeader />
        <CompletedTableItem />
        <CompletedTableItem />
        <CompletedTableItem />
        <CompletedTableItem />
        <CompletedTableItem />
        <CompletedTableItem />
        <CompletedTableItem />
        <CompletedTableItem />
        <CompletedTableItem />
        <CompletedTableItem />
      </div>
    </>
  );
};

export default CompletedPage;
