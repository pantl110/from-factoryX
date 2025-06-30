import { useState } from "react";
import { InvitationStatusColorMap, InvitationStatusType } from "./types";
import { DotsThree } from "@phosphor-icons/react";
import DeleteDropdown from "@/ui/dropdown/delete-dropdown";
import { usePortalDropdown } from "@/hooks/use-portal-dropdown";

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
  const { isOpen, openDropdown, closeDropdown, anchorRect } =
    usePortalDropdown();
  const textColor = InvitationStatusColorMap[invitationStatus];

  return (
    <>
      <div className="flex items-center justify-between w-full h-14 text-dg Me_Body-1 border-b border-[#eeeeee] group">
        <p className={`px-3 w-[150px] ${textColor}`}>{invitationStatus}</p>
        <p className="px-3 w-[150px]">{name ?? "-"}</p>
        <p className="px-3 flex-1">{email}</p>
        <p className="px-3 w-[150px]">{permission}</p>
        <p className="px-3 w-[150px]">{date}</p>
        <button
          onClick={openDropdown}
          className="relative w-9 h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <DotsThree size={20} className="text-sv" />
        </button>
      </div>

      {isOpen && anchorRect && (
        <div
          style={{
            position: "fixed",
            top: anchorRect.bottom + window.scrollY + 8,
            right: window.innerWidth - anchorRect.right,
            zIndex: 10,
          }}
        >
          <DeleteDropdown
            onClose={closeDropdown}
            // onDelete={() => {}}
          />
        </div>
      )}
    </>
  );
};

export default PermissionTableItem;
