import { clientData } from "@/mocks/client-data";
import ClientTableHeader from "./client-table-header";
import ClientTableItem from "./client-table-item";
import Pagination from "@/components/pagination";

const Client = () => {
  return (
    <>
      <div className="w-full px-10 overflow-x-auto">
        <ClientTableHeader />
        {clientData.map((client) => (
          <ClientTableItem
            clientType={client.type}
            companyName={client.companyName}
            businessNumber={client.businessNumber}
            representativeName={client.representativeName}
            businessType={client.businessType}
            businessCategory={client.businessCategory}
            contact={client.contact}
            email={client.email}
          />
        ))}
      </div>
      <Pagination />
    </>
  );
};

export default Client;
