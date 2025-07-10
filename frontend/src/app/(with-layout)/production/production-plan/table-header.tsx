import { tableHeader } from "./types";

const TableHeader = () => {
  return (
    <div className="flex items-center w-[1494px] h-12 Me_Body-1 bg-bg rounded text-sv sticky top-0 z-1">
      {tableHeader.map((header) => (
        <p key={header.name} className={`${header.width} px-3`}>
          {header.name}
        </p>
      ))}
    </div>
  );
};

export default TableHeader;
