import Chip from "@/ui/chip";
import { PermissionRoleType, PermissionRoleInfo } from "./types";

interface PermissionInfoItemProps {
  type: PermissionRoleType;
}

const PermissionInfoItem = ({ type }: PermissionInfoItemProps) => {
  const info = PermissionRoleInfo[type];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Chip
          text={info.type}
          bgColor={info.chipColor.bg}
          textColor={info.chipColor.text}
        />
        <p className="Heading-3">{info.type}</p>
      </div>
      <p className="Re_Body-1 text-dg whitespace-pre-line">
        {info.description}
      </p>
    </div>
  );
};

export default PermissionInfoItem;
