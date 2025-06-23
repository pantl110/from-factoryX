import Chip from "@/ui/chip";
import { PermissionType, PERMISSION_INFO } from "./types";

interface PermissionInfoItemProps {
  type: PermissionType;
}

const PermissionInfoItem = ({ type }: PermissionInfoItemProps) => {
  const info = PERMISSION_INFO[type];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Chip
          text={info.title}
          bgColor={info.chipColor.bg}
          textColor={info.chipColor.text}
        />
        <p className="Heading-3">{info.title}</p>
      </div>
      <p className="Re_Body-1 text-dg whitespace-pre-line">
        {info.description}
      </p>
    </div>
  );
};

export default PermissionInfoItem;
