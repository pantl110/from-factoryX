// import {
//   InventoryStatusColorMap,
//   InventoryStatusType,
// } from '@/types/status-type';
// import Chip from '@/ui/chip';

// interface MaterialStockStatusItemProps {
//   materialName: string;
//   materialCode: string;
//   unit: string;
//   unitQuantity: number;
//   stockQuantity: number;
//   inventoryStatus: InventoryStatusType;
// }
// const MaterialStockStatusItem = ({
//   materialName,
//   materialCode,
//   unit,
//   unitQuantity,
//   stockQuantity,
//   inventoryStatus,
// }: MaterialStockStatusItemProps) => {
//   const colors = InventoryStatusColorMap[inventoryStatus];

//   return (
//     <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1">
//       <p className="flex-2 px-3 text-dg truncate" title={materialName}>
//         {materialName}
//       </p>
//       <p className="flex-1 px-3 text-dg">{materialCode}</p>
//       <p className="w-[80px] px-3 text-dg">{unit}</p>
//       <p className="flex-1 px-3 text-dg">{unitQuantity.toLocaleString()}</p>
//       <p className="flex-1 px-3 text-dg">{stockQuantity.toLocaleString()}</p>
//       <div className="flex-1 px-3">
//         <Chip
//           text={inventoryStatus}
//           textColor={colors.textColor}
//           bgColor={colors.bgColor}
//         />
//       </div>
//     </div>
//   );
// };

// export default MaterialStockStatusItem;
