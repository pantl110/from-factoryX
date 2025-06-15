import PermissionInfoItem from "./permission-info-item";
import PermissionTableHeader from "./permission-table-header";
import PermissionTableItem from "./permission-table-item";
import MiniBtn from "@/ui/mini-btn";

import { PermissionType } from "./types";

const Permission = () => {
  const permissionTypes: PermissionType[] = [
    "SYSTEM_ADMIN",
    "OPERATOR",
    "VIEWER",
  ];

  return (
    <div className="px-10">
      <div className="w-full h-[1px] bg-[#eeeeee] mb-8" />
      <div className="flex flex-col gap-7 pb-8">
        <div className="flex flex-col gap-7 pb-8 border-b border-[#eeeeee]">
          {permissionTypes.map((type) => (
            <PermissionInfoItem key={type} type={type} />
          ))}
        </div>
        <div className="flex items-center justify-between w-full">
          <h3 className="Heading-3">팀원 권한</h3>
          <MiniBtn
            text="초대하기"
            textColor="text-primary"
            bgColor="bg-primary-8"
          />
        </div>
        <div className="">
          <PermissionTableHeader />
          <PermissionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
          <PermissionTableItem
            date="2025-06-14"
            card="현대카드(**** 4821)"
            amount="19,900원"
            plan="Basic"
          />
        </div>
      </div>
    </div>
  );
};

export default Permission;
