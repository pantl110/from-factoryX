// 'use client';

// import Input from '@/ui/input';
// import {
//   Controller,
//   UseFormSetValue,
//   FieldErrors,
//   Control,
// } from 'react-hook-form';
// import { useDropdownFilter } from '@/hooks/use-dropdown-filter';
// import { clientData } from '@/mocks/client-data';
// import { ClientNameDropdown } from '@/ui/dropdown/client-name-dropdown';
// import { useEffect } from 'react';
// import { ClientModel } from '@/types/data-model';
// import {
//   formatBusinessNumber,
//   formatPhoneNumber,
//   formatFaxNumber,
//   formatDate,
// } from '@/hooks/format-number';

// interface InputSectionProps {
//   clientDataParam: string | null;
//   setValue: UseFormSetValue<ClientModel>;
//   errors: FieldErrors<ClientModel>;
//   control: Control<ClientModel>;
// }

// const InputSection = ({
//   clientDataParam,
//   setValue,
//   errors,
//   control,
// }: InputSectionProps) => {
//   const {
//     setInput: setCompanyNameInput,
//     isOpen: isCompanyNameDropdownOpen,
//     setIsOpen: setIsCompanyNameDropdownOpen,
//     filtered: filteredClients,
//     handleSelect: handleCompanyNameSelect,
//   } = useDropdownFilter(clientData, (item) => item.companyName);

//   useEffect(() => {
//     if (clientDataParam) {
//       try {
//         const data = JSON.parse(decodeURIComponent(clientDataParam));
//         Object.entries(data).forEach(([key, value]) => {
//           if (key === 'businessNumber') {
//             setValue(
//               'business_registration_number',
//               formatBusinessNumber(String(value ?? ''))
//             );
//           } else if (key === 'contact') {
//             setValue('phone', formatPhoneNumber(String(value ?? '')));
//           } else if (key === 'fax') {
//             setValue('fax', formatFaxNumber(String(value ?? '')));
//           } else if (key === 'companyName') {
//             setValue('name', String(value ?? ''));
//           } else {
//             setValue(key as keyof ClientModel, value as string);
//           }
//         });
//       } catch {
//         // 파싱 에러 무시
//       }
//     }
//   }, [clientDataParam, setValue]);

//   const handleSelectClient = (item: ClientModel) => {
//     handleCompanyNameSelect(item);

//     // 선택한 거래처 정보로 폼 자동 채우기
//     setValue('name', item.name);
//     setValue(
//       'business_registration_number',
//       formatBusinessNumber(String(item.business_registration_number ?? ''))
//     );
//     setValue('representative_name', item.representative_name);
//     setValue('dueDate', item.dueDate);
//     setValue('representative_name', item.representative_name);
//     setValue('address', item.address);
//     setValue('address', item.address || '');
//     setValue('responsibleName', item.responsibleName);
//     setValue('email', item.email);
//     setValue('phone', formatPhoneNumber(String(item.phone ?? '')));
//     setValue('fax', formatFaxNumber(String(item.fax ?? '')));

//     setIsCompanyNameDropdownOpen(false);
//   };

//   return (
//     <div className="flex flex-col gap-4">
//       <div className="flex gap-2">
//         <div className="flex-1 relative">
//           <Controller
//             name="companyName"
//             control={control}
//             rules={{ required: true }}
//             render={({ field }) => {
//               const handleCompanyNameBlur = () =>
//                 setTimeout(() => setIsCompanyNameDropdownOpen(false), 150);
//               return (
//                 <Input
//                   label="업체명"
//                   placeholder="업체명을 입력하세요."
//                   required
//                   showError={!!errors.companyName}
//                   value={field.value || ''}
//                   onChange={(e) => {
//                     field.onChange(e);
//                     setCompanyNameInput(e.target.value);
//                   }}
//                   onFocus={() => setIsCompanyNameDropdownOpen(true)}
//                   onBlur={handleCompanyNameBlur}
//                   ref={field.ref}
//                   name={field.name}
//                 />
//               );
//             }}
//           />
//           {isCompanyNameDropdownOpen && filteredClients.length > 0 && (
//             <div className="absolute left-0 top-21 z-10 w-full">
//               <ClientNameDropdown
//                 items={filteredClients}
//                 onSelect={handleSelectClient}
//                 width="w-full"
//               />
//             </div>
//           )}
//         </div>
//         <div className="flex-1">
//           <Controller
//             name="businessNumber"
//             control={control}
//             rules={{ required: true }}
//             render={({ field }) => {
//               return (
//                 <Input
//                   label="사업자등록번호"
//                   placeholder="사업자등록번호를 입력하세요."
//                   required
//                   showError={!!errors.businessNumber}
//                   value={field.value || ''}
//                   onChange={(e) => {
//                     const formatted = formatBusinessNumber(e.target.value);
//                     field.onChange(formatted);
//                   }}
//                   ref={field.ref}
//                   name={field.name}
//                 />
//               );
//             }}
//           />
//         </div>
//       </div>
//       <div className="flex gap-2">
//         <Controller
//           name="representativeName"
//           control={control}
//           rules={{ required: true }}
//           render={({ field }) => (
//             <Input
//               label="대표자명"
//               placeholder="대표자명을 입력하세요."
//               required
//               showError={!!errors.representativeName}
//               {...field}
//             />
//           )}
//         />
//         <Controller
//           name="dueDate"
//           control={control}
//           rules={{ required: true }}
//           render={({ field }) => (
//             <Input
//               label="납기일자"
//               placeholder="납기일자를 입력하세요."
//               required
//               showError={!!errors.dueDate}
//               value={field.value || ''}
//               onChange={(e) => {
//                 const formatted = formatDate(e.target.value);
//                 field.onChange(formatted);
//               }}
//               ref={field.ref}
//               name={field.name}
//             />
//           )}
//         />
//       </div>
//       <div className="flex gap-2">
//         <Controller
//           name="companyAddress"
//           control={control}
//           rules={{ required: true }}
//           render={({ field }) => (
//             <Input
//               label="업태"
//               placeholder="업태를 입력하세요."
//               showError={!!errors.companyAddress}
//               {...field}
//             />
//           )}
//         />
//         <Controller
//           name="companyAddress"
//           control={control}
//           rules={{ required: true }}
//           render={({ field }) => (
//             <Input
//               label="종목"
//               placeholder="종목을 입력하세요."
//               showError={!!errors.companyAddress}
//               {...field}
//             />
//           )}
//         />
//       </div>
//       <div className="flex gap-2">
//         <Controller
//           name="deliveryAddress"
//           control={control}
//           render={({ field }) => (
//             <Input
//               label="사업상 주소"
//               placeholder="사업상 주소를 입력하세요."
//               required
//               {...field}
//             />
//           )}
//         />
//       </div>
//       <div className="flex gap-2">
//         <Controller
//           name="responsibleName"
//           control={control}
//           rules={{ required: true }}
//           render={({ field }) => (
//             <Input
//               label="담당자명"
//               placeholder="담당자명을 입력하세요."
//               required
//               showError={!!errors.responsibleName}
//               {...field}
//             />
//           )}
//         />
//         <Controller
//           name="email"
//           control={control}
//           rules={{ required: true }}
//           render={({ field }) => (
//             <Input
//               label="이메일"
//               placeholder="담당자 이메일을 입력하세요."
//               required
//               showError={!!errors.email}
//               {...field}
//             />
//           )}
//         />
//       </div>
//       <div className="flex gap-2">
//         <Controller
//           name="contact"
//           control={control}
//           render={({ field }) => {
//             return (
//               <Input
//                 placeholder="연락처를 입력하세요."
//                 label="연락처"
//                 value={field.value || ''}
//                 onChange={(e) => {
//                   const formatted = formatPhoneNumber(e.target.value);
//                   field.onChange(formatted);
//                 }}
//                 ref={field.ref}
//                 name={field.name}
//               />
//             );
//           }}
//         />
//         <Controller
//           name="fax"
//           control={control}
//           render={({ field }) => {
//             return (
//               <Input
//                 label="팩스 번호"
//                 placeholder="팩스 번호를 입력하세요."
//                 value={field.value || ''}
//                 onChange={(e) => {
//                   const formatted = formatFaxNumber(e.target.value);
//                   field.onChange(formatted);
//                 }}
//                 ref={field.ref}
//                 name={field.name}
//               />
//             );
//           }}
//         />
//       </div>
//     </div>
//   );
// };

// export default InputSection;
