// import InfoLabelValue from '@/ui/info-label-value';
// import { ClientModel } from '@/types/data-model';

// interface ClientInfoProps {
//   clientData: ClientModel;
//   dueDate: string;
// }

// const ClientInfo = ({ clientData, dueDate }: ClientInfoProps) => {
//   return (
//     <div className="flex flex-col gap-3">
//       <h3 className="Heading-3 h-10 items-center flex">공급자 정보</h3>
//       <div className="width-full border-b border-lg">
//         <div className="flex">
//           <InfoLabelValue label="회사명" value={clientData.name} />
//           <InfoLabelValue
//             label="사업자등록번호"
//             value={clientData.business_registration_number}
//           />
//         </div>
//         <div className="flex">
//           <InfoLabelValue
//             label="대표자명"
//             value={clientData.representative_name}
//           />
//           <InfoLabelValue label="팩스 번호" value={clientData.fax} />
//         </div>
//         <div className="flex">
//           <InfoLabelValue label="업태" value={clientData.business_type} />
//           <InfoLabelValue label="종목" value={clientData.business_category} />
//         </div>
//         <div className="flex">
//           <InfoLabelValue label="연락처" value={clientData.phone} />
//           <InfoLabelValue label="이메일" value={clientData.email} />
//         </div>
//         <InfoLabelValue label="사업장 주소" value={clientData.address} />
//       </div>
//     </div>
//   );
// };

// export default ClientInfo;
