import PermissionInfoItem from './permission-info-item';
import PermissionTableHeader from './permission-table-header';
import PermissionTableItem from './permission-table-item';
import MiniBtn from '@/ui/mini-btn';
import { useCheckAll } from '@/hooks/use-check-all';
import Pagination from '@/components/pagination';
import { PermissionRoleType } from './types';
import { useState, useEffect } from 'react';
import InviteModal from './modals/invite-modal';
import DeleteTeamMemberModal from './modals/delete-team-member-modal';
import useGetMembers from '@/hooks/factory/factory-member/use-get-members';
import useDeleteMember from '@/hooks/factory/factory-member/use-delete-member';
import { useGetFactory } from '@/hooks/factory/use-get-factory';
import useMemberStore from '@/store/member-store';
import Spinner from '@/ui/spinner';
import Tooltip from '@/ui/tooltip';
import NoHistoryBox from '@/ui/no-history-box';

const Permission = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const factoryId = useMemberStore((state) => state.factoryId);
  const initializeFactoryId = useMemberStore(
    (state) => state.initializeFactoryId
  );
  const { getMembers, members, isLoading, error } = useGetMembers();
  const { deleteMember } = useDeleteMember();
  const { getFactory, factory } = useGetFactory();

  const [page, setPage] = useState(1);
  const pageSize = 8;

  // factoryId가 null이면 초기화
  useEffect(() => {
    if (!factoryId) {
      initializeFactoryId();
    }
  }, [factoryId, initializeFactoryId]);

  // 초대 중인 팀원 목록 불러오기
  useEffect(() => {
    if (factoryId) {
      getMembers({ factory_id: factoryId, page, page_size: pageSize });
      getFactory(factoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId, page]);

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

  // 체크박스 관리
  const itemIds = members?.data?.map((item) => item.id) || [];
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
        const result = await deleteMember(id, factoryId || 0);
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
          getMembers({ factory_id: factoryId });
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
      getMembers({ factory_id: factoryId });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 pb-10 px-10">
        <div className="flex flex-col gap-7 pb-8 border-b border-lg">
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
                  <div className="absolute w-[400px] flex justify-end top-12 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Tooltip
                      color="red"
                      text="팀원을 초대 전, 회사정보(필수 항목)를 먼저 입력해주세요."
                      position="right"
                    />
                  </div>
                )}
              </div>
              {members?.data && members.data.length > 1 && (
                <>
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
                </>
              )}
            </div>
          </div>

          <div>
            <div>
              {isLoading || error ? (
                <div className="flex justify-center items-center h-100">
                  <Spinner />
                </div>
              ) : !members?.data || members.data.length === 1 ? (
                // 자기 자신은 제외하고 UI로 보여주지 않음
                <NoHistoryBox
                  title="초대된 팀원이 없어요."
                  text="팀원이 초대되면 이곳에 표시돼요."
                />
              ) : (
                <>
                  <PermissionTableHeader
                    isAllChecked={isAllChecked}
                    onToggleAll={toggleAll}
                  />
                  {members?.data && members.data.length > 0
                    ? [...members.data].map((item) =>
                        item ? (
                          <PermissionTableItem
                            key={item.id}
                            item={item}
                            isChecked={isChecked(item.id)}
                            onToggle={() => toggleOne(item.id)}
                            onUpdate={() => {
                              // 권한 변경 후 초대 중인 멤버 목록 새로고침
                              if (factoryId) {
                                getMembers({
                                  factory_id: factoryId,
                                  page,
                                  page_size: pageSize,
                                });
                              }
                            }}
                          />
                        ) : null
                      )
                    : null}
                </>
              )}
            </div>
            {members?.pageCnt && members.pageCnt > 1 && (
              <Pagination
                currentPage={members.curPage || 1}
                totalPages={members.pageCnt}
                onPageChange={setPage}
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
