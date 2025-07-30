// import { ProjectStatusColorMap } from '@/types/status-type';
// import Chip from '@/ui/chip';
// import { ProjectResponseModel } from '@/types/data-model';

// interface SearchOrderTableItemProps {
//   project: ProjectResponseModel;
// }

// const SearchOrderTableItem = ({ project }: SearchOrderTableItemProps) => {
//   const chipColors = {
//     bgColor: ProjectStatusColorMap[project.status].bgColor,
//     textColor: ProjectStatusColorMap[project.status].textColor,
//   };

//   return (
//     <div className="flex items-center h-14 w-[1448px] border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg">
//       <div className="px-3 w-[150px]">
//         <Chip
//           text={project.status}
//           bgColor={chipColors.bgColor}
//           textColor={chipColors.textColor}
//         />
//       </div>
//       <p className="flex-2 px-3 text-dg truncate" title={project.client_name}>
//         {project.client_name}
//       </p>
//       <p
//         className="flex-2 px-3 text-dg truncate"
//         title={
//           project.product_names.length > 1
//             ? `${project.product_names[0]} 외 ${project.product_names.length - 1}개`
//             : project.product_names[0]
//         }
//       >
//         {project.product_names.length > 1
//           ? `${project.product_names[0]} 외 ${project.product_names.length - 1}개`
//           : project.product_names[0]}
//       </p>
//       <p className="w-[200px] px-3 text-dg truncate" title={project.start_date}>
//         {project.start_date}
//       </p>
//       <p className="w-[200px] px-3 text-dg truncate" title={project.due_date}>
//         {project.due_date}
//       </p>
//     </div>
//   );
// };

// export default SearchOrderTableItem;
