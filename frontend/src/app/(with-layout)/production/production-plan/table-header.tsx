import { tableHeader } from "./types";

const TableHeader = () => {
  return (
    <div className="flex items-center w-[1494px] h-12 border-t border-b border-lg Me_Body-1 bg-bg rounded text-sv">
      {tableHeader.map((header) => (
        <p key={header.name} className={`${header.width} px-3`}>
          {header.name}
        </p>
      ))}
    </div>
  );
};

export default TableHeader;
