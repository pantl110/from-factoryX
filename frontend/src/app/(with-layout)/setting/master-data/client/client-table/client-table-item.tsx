interface ClientTableItemProps {
  companyName: string;
  businessNumber: string;
  representativeName: string;
  businessType: string;
  businessCategory: string;
  contact: string;
  email: string;
}

const ClientTableItem = ({
  companyName,
  businessNumber,
  representativeName,
  businessType,
  businessCategory,
  contact,
  email,
}: ClientTableItemProps) => {
  return (
    <div className="flex h-12 items-center py-1 px-3 w-full border-b border-[#eeeeee] Me_Body-1 text-bl hover:bg-[#f8f8f8]">
      <p className="flex-1">{companyName}</p>
      <p className="flex-1">{businessNumber}</p>
      <p className="w-[100px]">{representativeName}</p>
      <p className="w-[200px]">{businessType}</p>
      <p className="flex-1">{businessCategory}</p>
      <p className="w-[150px]">{contact}</p>
      <p className="flex-1">{email}</p>
    </div>
  );
};

export default ClientTableItem;
