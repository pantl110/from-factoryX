import PermissionInfoItem from './permission-info-item';
import PermissionTableHeader from './permission-table-header';
import PermissionTableItem from './permission-table-item';
import MiniBtn from '@/ui/mini-btn';
import { useCheckAll } from '@/hooks/use-check-all';
import Pagination from '@/components/pagination';
import usePagination from '@/hooks/use-pagination';
import { PermissionRoleType } from './types';
import { useState, useEffect } from 'react';
import InviteModal from './modals/invite-modal';
import DeleteTeamMemberModal from './modals/delete-team-member-modal';
import useGetInvitingMembers from '@/hooks/factory-member/use-get-inviting-members';
import useDeleteMember from '@/hooks/factory-member/use-delete-member';
import { useGetFactory } from '@/hooks/factory/use-get-factory';
import useFactoryStore from '@/store/factory-store';
import Spinner from '@/ui/spinner';
import Tooltip from '@/ui/tooltip';

const Permission = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const factoryId = useFactoryStore((state) => state.factoryId);
  const { getInvitingMembers, invitingMembers, isLoading, error } =
    useGetInvitingMembers();
  const { deleteMember } = useDeleteMember();
  const { getFactory, factory } = useGetFactory();

  // 초대 중인 팀원 목록 불러오기
  useEffect(() => {
    if (factoryId) {
      getInvitingMembers(factoryId);
      getFactory(factoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  const permissionRoleTypes: PermissionRoleType[] = [
    '시스템 관리자',
    '운영자',
    '조회자',
  ];

  // 공장 필수 정보 체크
  const isFactoryInfoComplete = factory
    ? factory.name &&
      factory.business_registration_number &&
      factory.representative_name &&
      factory.manager_email
    : false;

  // API에서 받은 데이터를 UI 형식에 맞게 변환
  const transformedData =
    invitingMembers?.map((invitingMember, index) => {
      const permission =
        invitingMember.role === 'admin'
          ? '시스템 관리자'
          : invitingMember.role === 'manager'
            ? '운영자'
            : '조회자';

      return {
        id: index + 1, // 순서대로 ID 부여
        invitationStatus: '대기 중' as const,
        name: '초대됨',
        email: invitingMember.email,
        permission,
        date: new Date().toLocaleDateString('ko-KR'),
      };
    }) || [];

  const sortedData = [...transformedData].sort((a, b) =>
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
    checkedIds,
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(itemIds);

  // 삭제 처리
  const handleDelete = async () => {
    if (checkedIds.length === 0) return;

    try {
      // 체크된 멤버들을 순차적으로 삭제
      const deletePromises = checkedIds.map(async (id) => {
        const result = await deleteMember(id);
        if (!result.success) {
          return { id, success: false, error: result.error };
        }
        return { id, success: true };
      });

      const results = await Promise.all(deletePromises);
      const failedDeletions = results.filter((result) => !result.success);

      if (failedDeletions.length > 0) {
        throw new Error('멤버 삭제 실패');
      }

      // 성공한 삭제가 있으면 목록 새로고침
      const successfulDeletions = results.filter((result) => result.success);
      if (successfulDeletions.length > 0) {
        // 목록 새로고침
        if (factoryId) {
          getInvitingMembers(factoryId);
        }
      }
    } catch (error) {
      console.error('💥 삭제 처리 중 오류:', error);
    } finally {
      setAllChecked(false);
      setIsDeleteModalOpen(false);
    }
  };

  // 초대 모달이 닫힐 때 목록 새로고침
  const handleInviteModalClose = () => {
    setIsInviteModalOpen(false);
    // 초대 중인 멤버 목록 다시 불러오기
    if (factoryId) {
      getInvitingMembers(factoryId);
    }
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
              <div className="relative group">
                <MiniBtn
                  text="초대하기"
                  textColor="text-primary"
                  bgColor="bg-primary-8"
                  onClick={() => {
                    setIsInviteModalOpen(true);
                  }}
                  hoverColor="hover:bg-secondary-hover"
                  disabled={!isFactoryInfoComplete}
                />
                {!isFactoryInfoComplete && (
                  <div className="absolute top-10 right-0 w-fit opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Tooltip
                      color="red"
                      text="팀원을 초대 전, 회사정보(필수 항목)를 먼저 입력해주세요."
                      position="right"
                    />
                  </div>
                )}
              </div>
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
            <div>
              <PermissionTableHeader
                isAllChecked={isAllChecked}
                onToggleAll={toggleAll}
              />
              {isLoading || error ? (
                <div className="flex justify-center items-center h-100">
                  <Spinner />
                </div>
              ) : currentItems.length === 0 ? (
                <div className="flex justify-center py-8 text-dg">
                  <span>초대된 팀원이 없습니다.</span>
                </div>
              ) : (
                currentItems.map((item) => (
                  <PermissionTableItem
                    key={item.id}
                    item={item}
                    isChecked={isChecked(item.id)}
                    onToggle={() => toggleOne(item.id)}
                    onUpdate={() => {
                      // 권한 변경 후 초대 중인 멤버 목록 새로고침
                      if (factoryId) {
                        getInvitingMembers(factoryId);
                      }
                    }}
                  />
                ))
              )}
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
      {isInviteModalOpen && <InviteModal onClose={handleInviteModalClose} />}

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
