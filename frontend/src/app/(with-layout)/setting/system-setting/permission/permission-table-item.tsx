import { InvitationStatusColorMap, InvitationStatusType } from "./types";

interface PermissionTableItemProps {
  invitationStatus: InvitationStatusType;
  name: string | null;
  email: string;
  permission: string;
  date: string;
}

const PermissionTableItem = ({
  invitationStatus,
  name,
  email,
  permission,
  date,
}: PermissionTableItemProps) => {
  const textColor = InvitationStatusColorMap[invitationStatus];

  return (
    <div className="flex items-center justify-between w-full h-14 text-dg Me_Body-1 border-b border-[#eeeeee]">
      <p className={`px-3 w-[150px] ${textColor}`}>{invitationStatus}</p>
      <p className="px-3 w-[150px]">{name ?? "-"}</p>
      <p className="px-3 flex-1">{email}</p>
      <p className="px-3 w-[150px]">{permission}</p>
      <p className="px-3 w-[150px]">{date}</p>
    </div>
  );
};

export default PermissionTableItem;
