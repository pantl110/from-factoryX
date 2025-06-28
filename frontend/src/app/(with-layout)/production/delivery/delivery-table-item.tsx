import { useState } from "react";
import { DeliveryDataModel } from "./types";
import DeliveryOverlay from "./modals/delevery-overlay";
import Chip from "@/ui/chip";
import {
  DeliveryStatusColorMap,
  DeliveryStatusType,
} from "@/types/status-type";

interface DeliveryTableItemProps {
  data: DeliveryDataModel;
}

const DeliveryTableItem = ({ data }: DeliveryTableItemProps) => {
  const [isDeliveryOverlayOpen, setIsDeliveryOverlayOpen] = useState(false);
  const colors =
    DeliveryStatusColorMap[data.deliveryStatus as DeliveryStatusType];

  return (
    <>
      <div className="flex items-center h-14 w-[1305px] rounded border-b border-[#eeeeee]">
        <div className="flex items-center py-3 px-2">
          <input type="checkbox" className="w-4 h-4 border-sv" />
        </div>
        <div className="w-[150px] flex items-center py-3 px-2">
          <Chip
            text={data.deliveryStatus || ""}
            sm={true}
            bgColor={colors.bgColor}
            textColor={colors.textColor}
          />
        </div>
        <div
          className="flex-2 px-3 flex justify-between cursor-pointer group"
          onClick={() => setIsDeliveryOverlayOpen(true)}
        >
          <p className=" text-dg Me_Body-1">{data.productName}</p>
          <p className="R_Body-1 text-gr opacity-0 group-hover:opacity-100 transition-opacity duration-200 ">
            납품표 보기
          </p>
        </div>
        <p className="flex-1 px-3 text-dg Me_Body-1">{data.productCode}</p>{" "}
        <p className="flex-1 px-3 tex t-dg Me_Body-1">{data.size}</p>
        <p className="w-[80px] px-3 text-dg Me_Body-1">{data.unit}</p>
        <p className="flex-1 px-3 text-dg Me_Body-1">
          {data.quantity.toLocaleString()}
        </p>
        <p className="flex-1 px-3 text-dg Me_Body-1">{data.date}</p>
      </div>

      {isDeliveryOverlayOpen && (
        <DeliveryOverlay
          onClose={() => setIsDeliveryOverlayOpen(false)}
          data={data}
        />
      )}
    </>
  );
};

export default DeliveryTableItem;
