'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductionPlanSaveModal from './modals/production-plan-save-modal';
import TableHeader from './table-header';
import TableItem from './table-item';
import {
  ProjectPlanModel,
  EquipmentResponseModel,
  ProjectStatusType,
} from '@/types/data-model';
import { OperationStatusType } from '@/types/status-type';
import usePageStatusStore from '@/store/page-status-store';
import OperationStatusDropdown from './modals/operation-status-dropdown';
import { createPortal } from 'react-dom';
import FacilityDropdown from './modals/facility-dropdown';
import {
  useGetProjectPlans,
  useUpdateProjectPlan,
  useGetEquipment,
  usePortalDropdown,
  useProductionPlanValidation,
  useToast,
} from '@/hooks';
import { useParams } from 'next/navigation';
import Spinner from '@/ui/spinner';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';

interface ProductionPlanProps {
  handleChangeStatus: (status: ProjectStatusType) => void;
  projectStatus?: ProjectStatusType;
  onProjectStatusChange?: () => void;
}

const ProductionPlan = ({
  handleChangeStatus,
  projectStatus,
}: ProductionPlanProps) => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;

  // API 호출
  const { getProjectPlans, isLoading, error } = useGetProjectPlans();
  const { updateProjectPlan } = useUpdateProjectPlan();
  const { getAllEquipmentList } = useGetEquipment();
  const [projectPlans, setProjectPlans] = useState<ProjectPlanModel[]>([]);
  const [allEquipments, setAllEquipments] = useState<EquipmentResponseModel[]>(
    []
  );

  // Form 데이터 저장
  interface ProductionPlanFormDataModel {
    quantity: number;
    equipment_id: number;
    start_date: string;
    end_date: string;
  }
  const [formChanges, setFormChanges] = useState<
    Record<number, ProductionPlanFormDataModel>
  >({});

  // 추가 생산 계획 생성 함수
  const handleAddPlan = async (
    planData: ProductionPlanFormDataModel,
    parentPlanId: number
  ) => {
    try {
      console.log('새로운 생산 계획 생성:', planData);

      // 고유한 임시 ID 생성 (타임스탬프 + 랜덤 숫자 + 부모 ID)
      const tempId = -(Date.now() + Math.random() * 1000000 + parentPlanId);

      // 임시 계획 객체 생성
      const tempPlan = {
        id: tempId,
        quantity: planData.quantity,
        equipment: { id: planData.equipment_id || 0, name: '임시 설비' },
        start_date: planData.start_date,
        end_date: planData.end_date,
        status: 'pending',
        material_status: '충분',
        avg_production_time: 0,
        quotation_product: {
          quantity: 0,
          is_delivery: false,
          product: { name: '', code: '', spec: '', unit: '', buffer_rate: 0 },
        },
      } as ProjectPlanModel;

      // projectPlans에 부모 계획 바로 다음에 새로 생성된 플랜 추가
      setProjectPlans((prev) => {
        const parentIndex = prev.findIndex((plan) => plan.id === parentPlanId);
        if (parentIndex === -1) {
          return [...prev, tempPlan];
        }
        const newPlans = [...prev];
        newPlans.splice(parentIndex + 1, 0, tempPlan);
        return newPlans;
      });

      // formChanges에도 추가 (변경사항으로 관리)
      setFormChanges((prev) => ({
        ...prev,
        [tempId]: planData,
      }));

      // 토스트 메시지 표시 (선택사항)
      // showToast('추가 생산 계획이 생성되었습니다.');
    } catch {
      alert('추가 생산 계획 생성 중 오류가 발생했습니다.');
    }
  };

  // 추가 계획 제거 함수
  const removeAdditionalPlan = (parentPlanId: number) => {
    setProjectPlans((prev) => {
      const parentIndex = prev.findIndex((plan) => plan.id === parentPlanId);
      if (parentIndex === -1) return prev;

      // 부모 계획 다음에 있는 추가 계획(음수 ID) 찾기
      const additionalPlanIndex = parentIndex + 1;
      if (
        additionalPlanIndex < prev.length &&
        prev[additionalPlanIndex].id < 0
      ) {
        const additionalPlanId = prev[additionalPlanIndex].id;

        // 추가 계획 제거
        const newPlans = prev.filter((plan) => plan.id !== additionalPlanId);

        // formChanges에서도 제거
        setFormChanges((prevFormChanges) => {
          const { [additionalPlanId]: removed, ...rest } = prevFormChanges;
          return rest;
        });

        console.log('추가 계획이 제거되었습니다.');
        return newPlans;
      }

      return prev;
    });
  };

  // 토스트 훅들
  const {
    isToastOpen: isEquipmentToastOpen,
    isVisible: isEquipmentToastVisible,
    showToast: showEquipmentToast,
  } = useToast(); // 설비 중복 사용 토스트
  const {
    isToastOpen: isTimeToastOpen,
    isVisible: isTimeToastVisible,
    showToast: showTimeToast,
  } = useToast(3000); // 시간 중복 토스트

  // production의 "생산 대기" 상태의 "생산 계획" 탭에서 저장 버튼 클릭 시 모달 오픈
  const isProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.isProductionPlanSaveModalOpen
  );
  const setProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.setProductionPlanSaveModalOpen
  );
  // 모든 품목이 가동 완료 상태인지 여부 확인
  const setAllProductionCompleted = usePageStatusStore(
    (state) => state.setAllProductionCompleted
  );

  // 전체 설비 목록 로드 (초기 로드만)
  useEffect(() => {
    const loadAllEquipments = async () => {
      try {
        const result = await getAllEquipmentList();
        if (result && result.data) {
          setAllEquipments(result.data);
        }
      } catch (error) {
        console.error('전체 설비 목록 로드 실패:', error);
      }
    };

    loadAllEquipments();
  }, [getAllEquipmentList]);

  // 프로젝트 계획 데이터 로드 (초기 로드만)
  useEffect(() => {
    const loadProjectPlans = async () => {
      if (!projectId) return;

      const result = await getProjectPlans(projectId);
      if (result.success && result.data) {
        setProjectPlans(result.data);

        // formChanges를 원본 데이터로 초기화
        const initialFormData: Record<number, ProductionPlanFormDataModel> = {};
        result.data.forEach((plan: ProjectPlanModel) => {
          initialFormData[plan.id] = {
            quantity: plan.quantity,
            equipment_id: plan.equipment.id,
            start_date: plan.start_date
              ? new Date(plan.start_date)
                  .toISOString()
                  .slice(0, 16)
                  .replace('T', ' ')
              : '',
            end_date: plan.end_date
              ? new Date(plan.end_date)
                  .toISOString()
                  .slice(0, 16)
                  .replace('T', ' ')
              : '',
          };
        });
        setFormChanges(initialFormData);
      }
    };

    loadProjectPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // 생산 계획 검증 훅 사용
  useProductionPlanValidation(projectPlans, formChanges);

  // 모든 품목이 가동 완료 상태인지 확인
  const isAllProductionCompleted = projectPlans.every(
    (plan) => plan.status === 'completed'
  );
  // 모든 품목이 가동 완료 상태일 때 store 업데이트
  useEffect(() => {
    setAllProductionCompleted(isAllProductionCompleted);
  }, [isAllProductionCompleted, setAllProductionCompleted]);

  // 가동상태 드랍다운운을 row별로 관리
  const {
    isOpen: isOperationStatusDropdownOpen,
    openDropdown: openOperationStatusDropdown,
    closeDropdown: closeOperationStatusDropdown,
    anchorRect: operationStatusAnchorRect,
  } = usePortalDropdown();
  const [operationStatusDropdownRowId, setOperationStatusDropdownRowId] =
    useState<number | null>(null);
  const handleOperationStatusClick = (e: React.MouseEvent, rowId: number) => {
    openOperationStatusDropdown(e);
    setOperationStatusDropdownRowId(rowId);
  };
  const handleCloseOperationStatusModal = () => {
    setOperationStatusDropdownRowId(null);
    closeOperationStatusDropdown();
  };

  // 가동 상태 변경 핸들러
  const handleOperationStatusChange = async (status: OperationStatusType) => {
    if (!operationStatusDropdownRowId) return;

    try {
      const result = await updateProjectPlan(operationStatusDropdownRowId, {
        status,
      });
      if (result.success) {
        // 상태 변경 성공 시 해당 plan의 상태만 업데이트
        setProjectPlans((prev) =>
          prev.map((plan) =>
            plan.id === operationStatusDropdownRowId
              ? { ...plan, status }
              : plan
          )
        );
      }
    } catch {
      alert('가동 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 시설 드랍다운을 row별로 관리
  const {
    isOpen: isFacilityDropdownOpen,
    openDropdown: openFacilityDropdown,
    closeDropdown: closeFacilityDropdown,
    anchorRect: facilityAnchorRect,
  } = usePortalDropdown();
  const [facilityDropdownRowId, setFacilityDropdownRowId] = useState<
    number | null
  >(null);
  // 설비 드롭다운 열고 닫는 핸들러
  const handleFacilityClick = (e: React.MouseEvent, rowId: number) => {
    openFacilityDropdown(e);
    setFacilityDropdownRowId(rowId); // 어떤 행의 설비 드롭다운을 열지 저장
  };
  const handleCloseFacilityDropdown = () => {
    setFacilityDropdownRowId(null);
    closeFacilityDropdown();
  };

  // 설비 선택 핸들러
  const handleEquipmentSelect = (equipment: EquipmentResponseModel) => {
    // facilityDropdownRowId가 실제 projectplanid인지 확인
    const originalPlan = projectPlans.find(
      (p) => p.id === facilityDropdownRowId
    );

    if (!originalPlan) {
      // 새로 생긴 플랜의 설비 선택인 경우 (projectplanid가 없음)
      console.log('새로 생긴 플랜의 설비 선택 처리');
      // 새로 생긴 플랜의 설비는 TableItem 컴포넌트에서 직접 처리해야 함
      // 여기서는 드롭다운만 닫기
      handleCloseFacilityDropdown();
      return;
    }

    // 원본 플랜의 설비 선택인 경우 (projectplanid가 있음)
    if (!facilityDropdownRowId) return;

    const currentFormData = formChanges[facilityDropdownRowId];

    // 가동중인 설비인지 확인
    if (currentFormData) {
      // 설비 충돌 검사 (다른 프로젝트에서 가동 중인지)
      const hasEquipmentConflict = projectPlans.some(
        (plan) =>
          plan.id !== facilityDropdownRowId &&
          plan.equipment.id === equipment.id &&
          plan.status === 'production'
      );

      if (hasEquipmentConflict) {
        showEquipmentToast();
        handleCloseFacilityDropdown(); // 드롭다운 닫기
        return; // 충돌이 있으면 설비 변경을 중단
      }
    }

    // form 데이터에 설비 변경 반영
    setFormChanges((prev) => {
      if (!facilityDropdownRowId) return prev;

      const currentPlan = projectPlans.find(
        (p) => p.id === facilityDropdownRowId
      );
      const currentFormData = prev[facilityDropdownRowId] || {};

      const updated = {
        ...prev,
        [facilityDropdownRowId]: {
          // 기존 formChanges의 값을 우선 사용하고, 없으면 원본 데이터 사용
          quantity: currentFormData.quantity ?? currentPlan?.quantity ?? 0,
          equipment_id: equipment.id, // 새로운 설비 ID로 명시적 설정
          start_date:
            currentFormData.start_date ??
            (currentPlan?.start_date
              ? new Date(currentPlan.start_date)
                  .toISOString()
                  .slice(0, 16)
                  .replace('T', ' ')
              : ''),
          end_date:
            currentFormData.end_date ??
            (currentPlan?.end_date
              ? new Date(currentPlan.end_date)
                  .toISOString()
                  .slice(0, 16)
                  .replace('T', ' ')
              : ''),
        },
      };

      console.log('formChanges 업데이트:', updated);
      return updated;
    });

    // 설비 변경 성공 시 드롭다운 닫기
    handleCloseFacilityDropdown();
  };

  // 시간대 충돌 검사 함수
  const checkTimeConflicts = useCallback(
    (planId: number, formData: ProductionPlanFormDataModel) => {
      const originalPlan = projectPlans.find((p) => p.id === planId);
      if (!originalPlan) return false;

      // 시간대 충돌 검사
      return projectPlans.some((plan) => {
        if (plan.id === planId) return false; // 자기 자신은 제외

        // 같은 설비인지 확인
        if (plan.equipment.id !== formData.equipment_id) return false;

        // 날짜가 설정되어 있는지 확인
        if (
          !formData.start_date ||
          !formData.end_date ||
          !plan.start_date ||
          !plan.end_date
        )
          return false;

        // 날짜 형식을 Date 객체로 변환
        const newStartDate = new Date(formData.start_date);
        const newEndDate = new Date(formData.end_date);
        const existingStartDate = new Date(plan.start_date);
        const existingEndDate = new Date(plan.end_date);

        // 날짜 범위가 겹치는지 확인
        const hasOverlap =
          newStartDate < existingEndDate && newEndDate > existingStartDate;

        return hasOverlap;
      });
    },
    [projectPlans]
  );

  // 폼 변경 핸들러 (자동 저장 제거, 저장 버튼 클릭 시에만 저장)
  const handleFormChange = useCallback(
    (planId: number, formData: ProductionPlanFormDataModel) => {
      setFormChanges((prev) => ({
        ...prev,
        [planId]: formData,
      }));

      // 시간대 충돌 검사만 수행 (저장은 하지 않음)
      const hasTimeConflict = checkTimeConflicts(planId, formData);

      if (hasTimeConflict) {
        showTimeToast();
        return;
      }
    },
    [showTimeToast, checkTimeConflicts]
  );

  // 개별 생산 계획 저장 함수 (저장 버튼 클릭 시)
  const handleFormSave = useCallback(
    async (planId: number, formData: ProductionPlanFormDataModel) => {
      try {
        // 시간대 충돌 검사
        const hasTimeConflict = checkTimeConflicts(planId, formData);
        if (hasTimeConflict) {
          showTimeToast();
          return;
        }

        const originalPlan = projectPlans.find((p) => p.id === planId);
        if (!originalPlan) return;

        const changes: Record<string, unknown> = {};

        // 원본과 달라졌는지만 비교, 값은 formData에서 직접 사용
        if (formData.quantity !== originalPlan.quantity) {
          changes.quantity = formData.quantity;
        }
        if (formData.equipment_id !== originalPlan.equipment.id) {
          changes.equipment_id = formData.equipment_id;
        }
        if (formData.start_date !== originalPlan.start_date) {
          changes.start_date = formData.start_date;
        }
        if (formData.end_date !== originalPlan.end_date) {
          changes.end_date = formData.end_date;
        }

        if (Object.keys(changes).length > 0) {
          const result = await updateProjectPlan(planId, changes);
          if (result.success) {
            // PATCH 성공 후 formChanges에서 해당 plan의 변경사항만 제거
            setFormChanges((prev) => {
              const newChanges = { ...prev };
              delete newChanges[planId];
              return newChanges;
            });

            // 백엔드에서 최신 데이터를 다시 가져와서 projectPlans 업데이트
            if (projectId) {
              const updatedResult = await getProjectPlans(projectId);
              if (updatedResult.success && updatedResult.data) {
                setProjectPlans(updatedResult.data);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error updating plan ${planId}:`, error);
      }
    },
    [
      updateProjectPlan,
      projectId,
      showTimeToast,
      projectPlans,
      checkTimeConflicts,
      getProjectPlans,
    ]
  );

  // 변경된 모든 생산 계획들을 한 번에 저장하는 함수
  const saveProjectPlans = async () => {
    try {
      // 저장 전에 시간대 충돌만 검사 (설비 충돌은 선택 시점에서 이미 검사됨)
      for (const [planId, formData] of Object.entries(formChanges)) {
        const hasTimeConflict = checkTimeConflicts(parseInt(planId), formData);
        if (hasTimeConflict) {
          showTimeToast();
          return { success: false, error: '시간대 충돌' };
        }
      }

      const updatePromises = Object.entries(formChanges).map(
        ([planId, formData]) => {
          const originalPlan = projectPlans.find(
            (p) => p.id === parseInt(planId)
          );
          if (!originalPlan) return Promise.resolve();

          // 변경된 것만 업데이트
          const changes: Record<string, unknown> = {};
          if (formData.quantity !== originalPlan.quantity)
            changes.quantity = formData.quantity;
          if (formData.equipment_id !== originalPlan.equipment.id)
            changes.equipment_id = formData.equipment_id;
          if (formData.start_date !== originalPlan.start_date)
            changes.start_date = formData.start_date;
          if (formData.end_date !== originalPlan.end_date)
            changes.end_date = formData.end_date;

          if (Object.keys(changes).length > 0) {
            return updateProjectPlan(parseInt(planId), changes);
          }
          return Promise.resolve({ success: true });
        }
      );

      await Promise.all(updatePromises);

      // 저장 후 백엔드에서 최신 데이터를 다시 가져와서 projectPlans 업데이트
      if (projectId) {
        const updatedResult = await getProjectPlans(projectId);
        if (updatedResult.success && updatedResult.data) {
          setProjectPlans(updatedResult.data);
        }
      }

      // 저장 후 저장된 플랜들만 formChanges에서 제거
      setFormChanges((prev) => {
        const updated = { ...prev };
        // 저장된 플랜들을 제거
        Object.keys(formChanges).forEach((planId) => {
          delete updated[parseInt(planId)];
        });
        return updated;
      });

      return { success: true };
    } catch {
      alert('생산 계획 저장 중 오류가 발생했습니다.');
      return { success: false };
    }
  };

  // 프로젝트 상태를 다음 단계로 변경하는 함수
  const changeProjectStatus = async () => {
    try {
      if (projectId) {
        // 현재 상태에 따라 다음 상태로 변경
        if (projectStatus === 'pending') {
          await handleChangeStatus('production');
        } else if (projectStatus === 'production') {
          await handleChangeStatus('manufactured');
        }
      }
      return { success: true };
    } catch {
      alert('프로젝트 상태 변경 중 오류가 발생했습니다.');
      return { success: false };
    }
  };

  const handleProductionPlanSave = async () => {
    // 다음 버튼 누르면 // 변경된 생산 계획들을 한 번에 저장
    try {
      // 1. 생산 계획 저장
      const saveResult = await saveProjectPlans();
      if (!saveResult.success) {
        // 시간대 충돌이 있으면 저장 중단
        if (saveResult.error === '시간대 충돌') {
          showTimeToast();
          return;
        }
        return;
      }

      // 2. 프로젝트 상태 변경
      const statusResult = await changeProjectStatus();
      if (!statusResult.success) {
        return;
      }

      // 3. 변경사항 초기화 및 모달 닫기
      setFormChanges({});
      setProductionPlanSaveModalOpen(false);

      // 4. 전체 페이지 리로드
      window.location.reload();
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 로딩 상태 처리
  if (isLoading || error) {
    return (
      <div className="flex items-center justify-center h-100">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="mx-10 pt-4 mb-10">
        <div className="w-full overflow-x-auto">
          <TableHeader />
          {projectPlans.map((item) => (
            <TableItem
              key={item.id}
              item={item}
              onOperationStatusClick={
                projectStatus === 'pending'
                  ? undefined
                  : (e) => handleOperationStatusClick(e, item.id)
              }
              onFacilityClick={(e) => handleFacilityClick(e, item.id)}
              onFormChange={handleFormChange}
              onSave={handleFormSave} // 저장 함수 추가
              onAddPlan={handleAddPlan} // 추가 계획 생성 함수
              onRemoveAdditionalPlan={removeAdditionalPlan} // 추가 계획 제거 함수
              formData={formChanges[item.id]}
              equipments={allEquipments}
              projectStatus={projectStatus}
            />
          ))}
        </div>
      </div>

      {/* 드랍다운 */}
      {operationStatusDropdownRowId !== null &&
        isOperationStatusDropdownOpen &&
        operationStatusAnchorRect &&
        createPortal(
          <OperationStatusDropdown
            onClose={handleCloseOperationStatusModal}
            onStatusChange={handleOperationStatusChange}
            style={{
              position: 'fixed',
              left: operationStatusAnchorRect.left - 9.6,
              top: operationStatusAnchorRect.bottom + 8,
              zIndex: 10,
            }}
          />,
          document.body
        )}

      {facilityDropdownRowId !== null &&
        isFacilityDropdownOpen &&
        facilityAnchorRect &&
        createPortal(
          <FacilityDropdown
            onClose={handleCloseFacilityDropdown}
            equipments={allEquipments}
            onSelect={handleEquipmentSelect}
            style={{
              position: 'fixed',
              left: facilityAnchorRect.left - 12,
              top: facilityAnchorRect.bottom + 11,
              width: facilityAnchorRect.width + 24,
              zIndex: 10,
            }}
          />,
          document.body
        )}

      {/* 다음 버튼 모달 // 생산대기 시 */}
      {isProductionPlanSaveModalOpen && (
        <ProductionPlanSaveModal
          onClose={() => {
            setProductionPlanSaveModalOpen(false);
          }}
          onSave={handleProductionPlanSave}
        />
      )}

      {/* 설비 중복 사용 토스트 */}
      {isEquipmentToastOpen && (
        <Toast
          text="해당 설비는 다른 프로젝트에서 이미 사용 중이에요."
          subtext="중복 등록을 피하려면 설비를 변경해 주세요."
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isEquipmentToastVisible}
        />
      )}

      {/* 시간대 중복 토스트 */}
      {isTimeToastOpen && (
        <Toast
          text="이미 해당 시간대에 같은 설비가 등록되어 있어요."
          subtext="다른 시간대나 설비로 변경해 주세요."
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isTimeToastVisible}
        />
      )}
    </>
  );
};

export default ProductionPlan;
