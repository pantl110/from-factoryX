interface TabAreaProps {
  activeTab: "quotation" | "history";
  activateQuotationTab: () => void;
}

const TabArea = ({ activeTab, activateQuotationTab }: TabAreaProps) => {
  return (
    <div className="flex gap-4 items-center Heading-3 pb-1 pr-10 border-b border-[#eeeeee]">
      <button
        className={`${
          activeTab === "quotation"
            ? "text-primary underline decoration-primary decoration-2 underline-offset-8"
            : "text-gr"
        } cursor-pointer`}
        onClick={activateQuotationTab}
      >
        견적요청서
      </button>
      <div
        className={`${
          activeTab === "history"
            ? "text-primary underline decoration-primary decoration-2 underline-offset-8"
            : "text-gr"
        }`}
      >
        히스토리
      </div>
    </div>
  );
};

export default TabArea;
