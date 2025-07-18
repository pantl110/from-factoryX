import PermissionInfoItem from './permission-info-item';
import PermissionTableHeader from './permission-table-header';
import PermissionTableItem from './permission-table-item';
import MiniBtn from '@/ui/mini-btn';
import { useCheckAll } from '@/hooks/use-check-all';
import Pagination from '@/components/pagination';
import usePagination from '@/hooks/use-pagination';
import { PermissionRoleType } from './types';
import { permissionData } from '@/mocks/permission-data';
import { useState } from 'react';
import InviteModal from './modals/invite-modal';
import DeleteTeamMemberModal from './modals/delete-team-member-modal';

const Permission = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const permissionRoleTypes: PermissionRoleType[] = [
    '시스템 관리자',
    '운영자',
    '조회자',
  ];

  const sortedData = [...permissionData].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const { currentItems, currentPage, totalPages, setCurrentPage } =
    usePagination({
      items: sortedData,
      itemsPerPage: 8,
    });

  // 체크박스 관리
  const itemIds = currentItems.map((item) => item.id);
  const {
    // checkedIds,
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(itemIds);

  // 삭제 처리
  const handleDelete = () => {
    // console.log("삭제할 팀원 ID들:", checkedIds);
    // TODO: API 호출로 실제 삭제 처리
    // setIsDeleteModalOpen(false);
    setAllChecked(false);
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-6 pb-10 px-10">
        <div className="flex flex-col gap-7 pb-8 border-b border-[#eeeeee]">
          {permissionRoleTypes.map((type) => (
            <PermissionInfoItem key={type} type={type} />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="Heading-3">팀원 권한</h3>
            <div className="flex gap-2.5">
              <MiniBtn
                text="초대하기"
                textColor="text-primary"
                bgColor="bg-primary-8"
                onClick={() => {
                  setIsInviteModalOpen(true);
                }}
                hoverColor="hover:bg-secondary-hover"
              />
              <MiniBtn
                text="취소"
                textColor="text-dg"
                borderColor="border-lg"
                onClick={() => {
                  setAllChecked(false);
                }}
                hoverColor="hover:bg-bg"
              />
              <MiniBtn
                text={getDeleteButtonText()}
                textColor={checkedCount === 0 ? 'text-dg' : 'text-red'}
                bgColor={checkedCount === 0 ? '' : 'bg-red-8'}
                borderColor={checkedCount === 0 ? 'border-lg' : ''}
                hoverColor={
                  checkedCount === 0 ? 'hover:bg-bg' : 'hover:bg-red-hover'
                }
                onClick={() => {
                  if (checkedCount > 0) {
                    setIsDeleteModalOpen(true);
                  }
                }}
              />
            </div>
          </div>

          <div>
            <div className="h-[496px]">
              <PermissionTableHeader
                isAllChecked={isAllChecked}
                onToggleAll={toggleAll}
              />
              {currentItems.map((item) => (
                <PermissionTableItem
                  key={item.id}
                  invitationStatus={item.invitationStatus}
                  name={item.name}
                  email={item.email}
                  permission={item.permission}
                  date={item.date}
                  isChecked={isChecked(item.id)}
                  onToggle={() => toggleOne(item.id)}
                />
              ))}
            </div>
            {totalPages >= 2 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>

      {/* 초대하기 모달 */}
      {isInviteModalOpen && (
        <InviteModal onClose={() => setIsInviteModalOpen(false)} />
      )}

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <DeleteTeamMemberModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export default Permission;
