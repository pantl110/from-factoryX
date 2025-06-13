import SearchDeleteTable from "@/ui/search-delete-table";
import MainTitleSec from "./main-title-sec";
import DocumentTable from "./document-table";

const DocumentPage = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <MainTitleSec />

      <div className="px-8">
        <SearchDeleteTable />
        <DocumentTable />
      </div>

      {/* 페이지네이션 */}
    </div>
  );
};

export default DocumentPage;
