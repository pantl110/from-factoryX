import { XIcon } from "@phosphor-icons/react/dist/ssr";

const DocumentTitle = () => {
  return (
    <div className="flex justify-between items-center border-b border-[#eeeeee]">
      <h3 className="Heading-3">원자재 사용 히스토리</h3>
      <div className="flex items-center justify-center w-10 h-10 ">
        <XIcon size={20} />
      </div>
    </div>
  );
};

export default DocumentTitle;
