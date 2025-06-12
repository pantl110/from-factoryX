import { CaretLineRightIcon } from "@phosphor-icons/react/dist/ssr";

const TaxDetailPanel = () => {
  return (
    <div className="w-[1000px]">
      <div className="flex flex-col gap-5 mt-5 mx-10">
        <div className="flex gap-2 items-center border-b border-[#eeeeee] pb-2">
          <div className="flex items-center justify-center w-10 h-10">
            <CaretLineRightIcon size={20} />
          </div>
          <h3 className="Heading-3 text-dg">세무/회계</h3>
        </div>
        <div className="">
          <h3 className="Heading-3 text-dg mb-3">거래처 정보</h3>
        </div>
        <div className=""></div>
      </div>
    </div>
  );
};

export default TaxDetailPanel;
