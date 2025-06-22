import PermissionInfoItem from "./permission-info-item";
import PermissionTableHeader from "./permission-table-header";
import PermissionTableItem from "./permission-table-item";
import MiniBtn from "@/ui/mini-btn";

import { PermissionRoleType } from "./types";
import { permissionData } from "@/mocks/permission-data";
import { useState } from "react";
import InviteModal from "./modals/invite-modal";

const Permission = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const permissionRoleTypes: PermissionRoleType[] = [
    "시스템 관리자",
    "운영자",
    "조회자",
  ];

  return (
    <>
      <div className="flex flex-col gap-6 pb-8 px-10">
        <div className="flex flex-col gap-7 pb-8 border-b border-[#eeeeee]">
          {permissionRoleTypes.map((type) => (
            <PermissionInfoItem key={type} type={type} />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="Heading-3">팀원 권한</h3>
            <MiniBtn
              text="초대하기"
              textColor="text-primary"
              bgColor="bg-primary-8"
              onClick={() => {
                setIsInviteModalOpen(true);
              }}
            />
          </div>

          <div>
            <PermissionTableHeader />
            {permissionData.map((item) => (
              <PermissionTableItem
                key={item.id}
                invitationStatus={item.invitationStatus}
                name={item.name}
                email={item.email}
                permission={item.permission}
                date={item.date}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 초대하기 모달 */}
      {isInviteModalOpen && (
        <InviteModal onClose={() => setIsInviteModalOpen(false)} />
      )}
    </>
  );
};

export default Permission;
