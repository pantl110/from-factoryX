// import Modal from '@/ui/modal/modal';
// import { FactoriesResponseModel } from '@/types/data-model';
// import MiniBtn from '@/ui/mini-btn';
// import { useDeleteMember, useDeleteFactory } from '@/hooks';
// import useMemberStore from '@/store/factory-store';
// import { useRouter } from 'next/navigation';

// interface FactorySelectModalProps {
//   factories: FactoriesResponseModel[];
//   onClose: () => void;
// }

// const FactorySelectModal = ({
//   factories,
//   onClose,
// }: FactorySelectModalProps) => {
//   const router = useRouter();
//   const setFactoryId = useMemberStore((state) => state.setFactoryId);
//   const { deleteFactory, isLoading: isDeleteFactoryLoading } =
//     useDeleteFactory();
//   const { deleteMember, isLoading: isDeleteMemberLoading } = useDeleteMember();

//   // invited_at 기준으로 정렬하여 가장 먼저 초대된 공장이 기존 공장
//   const sortedFactories = [...factories].sort((a, b) => {
//     const dateA = new Date(a.invited_at || 0);
//     const dateB = new Date(b.invited_at || 0);
//     return dateA.getTime() - dateB.getTime();
//   });

//   const existingFactory = sortedFactories[0]; // 가장 먼저 초대된 공장 (기존 공장)
//   const invitedFactories = sortedFactories.slice(1); // 초대받은 공장들
//   const invitedFactory = sortedFactories[1]; // 초대받은 공장들 중 가장 먼저 초대받은 공장

//   // 기존 공장 선택 시
//   const handleExistingFactorySelect = async () => {
//     if (existingFactory) {
//       setFactoryId(existingFactory.id);
//       // 초대받은 공장 멤버에서 모두 삭제
//       invitedFactories.forEach(async (factory) => {
//         await deleteMember(factory.id, existingFactory.id); // ‼️‼️‼️‼️‼️‼️‼️그 공장에서 멤버 아이디로 전환 필요
//       });
//       onClose();
//       router.push('/dashboard');
//     }
//   };

//   // 초대받은 공장 선택 시
//   const handleNewFactorySelect = async () => {
//     if (invitedFactory) {
//       setFactoryId(invitedFactory.id);

//       // 기존 공장에서 관리자인 경우 // 기존 공장 삭제
//       if (existingFactory.role === 'admin') {
//         await deleteFactory(existingFactory.id);
//       } else {
//         // 기존 공장에서 관리자가 아닌 경우 // 기존 공장에서 멤버 삭제
//         await deleteMember(existingFactory.id, invitedFactory.id); // ‼️‼️‼️‼️‼️‼️‼️그 공장에서 멤버 아이디로 전환 필요
//       }
//       // 초대받은 공장 중 나중에 초대받은 공장의 멤버에서 삭제
//       invitedFactories.slice(1).forEach(async (factory) => {
//         await deleteMember(factory.id, invitedFactory.id); // ‼️‼️‼️‼️‼️‼️‼️그 공장에서 멤버 아이디로 전환 필요
//       });

//       onClose();
//       router.push('/dashboard');
//     }
//   };

//   return (
//     <Modal
//       title="초대된 공장에 참여할까요?"
//       subtitle={`현재 사용 중인 계정은 이미 다른 공장에 소속돼 있어요.
// 새로운 공장에 참여하면 기존 공장에서 자동으로 탈퇴돼요.`}
//       onClose={onClose}
//       width="w-[520px]"
//       hideCloseIcon={true}
//     >
//       <div className="w-full flex justify-end gap-2.5 mt-4">
//         <MiniBtn
//           text="기존 공장 유지"
//           textColor="text-sv"
//           bgColor="bg-wh"
//           hoverColor="hover:bg-bg"
//           type="button"
//           onClick={handleExistingFactorySelect}
//           disabled={isDeleteFactoryLoading || isDeleteMemberLoading}
//         />
//         <MiniBtn
//           text="새 공장에 참여"
//           textColor="text-wh"
//           bgColor="bg-primary"
//           hoverColor="hover:bg-primary-hover"
//           onClick={handleNewFactorySelect}
//           disabled={isDeleteFactoryLoading || isDeleteMemberLoading}
//         />
//       </div>
//     </Modal>
//   );
// };

// export default FactorySelectModal;
