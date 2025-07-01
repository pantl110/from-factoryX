import { useState } from "react";
import { InvitationStatusColorMap, InvitationStatusType } from "./types";
import { Trash } from "@phosphor-icons/react";
import DeleteTeamMemberModal from "./modals/delete-team-member-modal";

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
  const [isDeleteTeamMemberModalOpen, setIsDeleteTeamMemberModalOpen] =
    useState(false);

  const textColor = InvitationStatusColorMap[invitationStatus];

  return (
    <>
      <div className="flex items-center justify-between w-full h-14 text-dg Me_Body-1 border-b border-[#eeeeee] group">
        <p className={`px-3 flex-1 ${textColor}`}>{invitationStatus}</p>
        <p className="px-3 flex-1">{name ?? "-"}</p>
        <p className="px-3 flex-2">{email}</p>
        <p className="px-3 flex-1">{permission}</p>
        <p className="px-3 flex-1">{date}</p>
        <button
          onClick={() => setIsDeleteTeamMemberModalOpen(true)}
          className="relative w-9 h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Trash size={20} className="text-sv" />
        </button>
      </div>

      {isDeleteTeamMemberModalOpen && (
        <DeleteTeamMemberModal
          onClose={() => setIsDeleteTeamMemberModalOpen(false)}
        />
      )}
    </>
  );
};

export default PermissionTableItem;
