import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import ProductionLogTableHeader from './production-log-table-header';
import ProductionLogTableItem from './production-log-table-item';
import {
  useCreateOrUpdateProjectPlan,
  useToast,
  checkDateValidity,
  convertUTCToKST,
} from '@/hooks';
import { useProjectPlansQuery, PROJECT_PLANS_QUERY_KEY } from '@/hooks';
import { ProjectPlanModel } from '@/types/data-model';
import { ProjectStatusType } from '@/types/status-type';
import { Spinner, Toast } from '@/ui';
import usePageStatusStore from '@/store/page-status-store';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import useMemberStore from '@/store/member-store';

interface ProductionLogProps {
  projectStatus: ProjectStatusType;
}

const ProductionLog = ({ projectStatus }: ProductionLogProps) => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;
  const queryClient = useQueryClient();
  const factoryId = useMemberStore((state) => state.factoryId);

  // React Query로 project plans 가져오기
  const {
    data: projectPlansData,
    isLoading,
    refetch: refetchProjectPlans,
  } = useProjectPlansQuery(projectId);

  // KST 변환된 project plans
  const projectPlans = useMemo(() => {
    if (!projectPlansData) return [];
    return projectPlansData.map((plan: ProjectPlanModel) => ({
      ...plan,
      start_date: plan.start_date ? convertUTCToKST(plan.start_date) : '',
      end_date: plan.end_date ? convertUTCToKST(plan.end_date) : '',
    }));
  }, [projectPlansData]);

  const { createOrUpdateProjectPlan } = useCreateOrUpdateProjectPlan();

  // store에서 함수들 가져오기
  const setHandleProductionLogSave = usePageStatusStore(
    (state) => state.setHandleProductionLogSave
  );
  const setProductionLogValid = usePageStatusStore(
    (state) => state.setProductionLogValid
  );
  const setAllProductionResultComplete = usePageStatusStore(
    (state) => state.setAllProductionResultComplete
  );

  // 폼 변경사항을 추적하는 상태
  const [formChanges, setFormChanges] = useState<
    Record<number, { quantity: number; start_date: string; end_date: string }>
  >({});

  // 각 행의 유효성 상태를 추적 (React Hook Form에서 전달)
  const [rowValidityMap, setRowValidityMap] = useState<Record<number, boolean>>(
    {}
  );

  // 토스트
  const {
    isToastOpen: isSaveToastOpen,
    isVisible: isSaveToastVisible,
    showToast: showSaveToast,
  } = useToast(); // 생산 계획 저장 토스트
  const {
    isToastOpen: isDateToastOpen,
    isVisible: isDateToastVisible,
    showToast: showDateToast,
  } = useToast(); // 유효한 날짜 토스트

  // projectPlans 변경 시 formChanges, rowValidityMap 초기화
  useEffect(() => {
    if (!projectPlans.length) return;

    // formChanges를 변환된 데이터로 초기화
    const initialFormData: Record<
      number,
      { quantity: number; start_date: string; end_date: string }
    > = {};
    projectPlans.forEach((plan: ProjectPlanModel) => {
      initialFormData[plan.id] = {
        quantity: plan.quantity,
        start_date: plan.start_date || '',
        end_date: plan.end_date || '',
      };
    });
    setFormChanges(initialFormData);

    // 초기 유효성 상태 리셋
    const initialValidity: Record<number, boolean> = {};
    projectPlans.forEach((plan: ProjectPlanModel) => {
      initialValidity[plan.id] = true; // 초기값은 true로 두고, 각 행에서 업데이트됨
    });
    setRowValidityMap(initialValidity);
    setProductionLogValid(true);

    // 모든 plan의 material_consumed가 true이고 defective_quantity가 입력되어 있는지 확인
    const isAllProductionResultComplete = projectPlans.every(
      (plan: ProjectPlanModel) =>
        plan.material_consumed === true &&
        plan.defective_quantity !== undefined &&
        plan.defective_quantity !== null
    );
    setAllProductionResultComplete(isAllProductionResultComplete);
  }, [projectPlans, setProductionLogValid, setAllProductionResultComplete]);

  // 특정 제품과 관련된 plan들만 업데이트하는 함수 (React Query 캐시 무효화)
  const updatePlansForProduct = useCallback(
    async (_productId: number) => {
      if (!projectId || !factoryId) return;

      // React Query 캐시 무효화하고 명시적으로 refetch하여 제품 정보 업데이트 반영
      await queryClient.invalidateQueries({
        queryKey: PROJECT_PLANS_QUERY_KEY(projectId, factoryId),
      });
      await refetchProjectPlans();
    },
    [projectId, factoryId, queryClient, refetchProjectPlans]
  );

  // 생산수량, 날짜 변경 핸들러 (자동 저장 제거)
  const handleFormChange = useCallback(
    (
      planId: number,
      formData: { quantity: number; start_date: string; end_date: string }
    ) => {
      setFormChanges((prev) => ({
        ...prev,
        [planId]: formData,
      }));
    },
    []
  );

  // 개별 행 저장 핸들러
  const handleRowSave = useCallback(
    async (planId: number) => {
      if (!projectId) return;

      const formData = formChanges[planId];
      if (!formData) return;

      const plan = projectPlans.find((p: ProjectPlanModel) => p.id === planId);
      if (!plan) return;

      // 원본 데이터와 비교하여 실제로 변경되었는지 확인
      const originalData = {
        quantity: plan.quantity,
        start_date: plan.start_date || '',
        end_date: plan.end_date || '',
      };

      if (
        formData.quantity === originalData.quantity &&
        formData.start_date === originalData.start_date &&
        formData.end_date === originalData.end_date
      ) {
        return;
      }

      try {
        // 날짜 유효성 검사
        const isDateValid = checkDateValidity(formData);
        if (!isDateValid) {
          showDateToast();
          return;
        }

        const result = await createOrUpdateProjectPlan({
          project_id: projectId,
          quotation_product_id: plan.quotation_product.id,
          equipment_id: plan.equipment.id,
          quantity: formData.quantity,
          start_date: formData.start_date,
          end_date: formData.end_date,
          defective_quantity: plan.defective_quantity ?? undefined,
          plan_id: planId > 0 ? planId : undefined,
        });

        if (result.success) {
          // 저장 성공 시 해당 행의 변경사항 제거
          setFormChanges((prev) => {
            const { [planId]: _removed, ...rest } = prev;
            return rest;
          });
          // 저장 성공 토스트 표시
          showSaveToast();
        } else {
          alert('저장에 실패했습니다.');
        }
      } catch {
        alert('저장 중 오류가 발생했습니다.');
      }
    },
    [
      projectId,
      formChanges,
      projectPlans,
      createOrUpdateProjectPlan,
      showSaveToast,
      showDateToast,
    ]
  );

  // 모든 변경사항을 저장하는 함수 (다음 버튼 클릭 시 호출)
  const handleSaveAll = useCallback(async () => {
    if (!projectId) return;

    // 변경된 항목이 있는지 확인
    const hasChanges = Object.keys(formChanges).length > 0;
    if (!hasChanges) {
      return; // 변경사항이 없으면 바로 반환
    }

    try {
      const updatePromises = Object.entries(formChanges).map(
        ([planId, formData]) => {
          const plan = projectPlans.find(
            (p: ProjectPlanModel) => p.id === parseInt(planId)
          );
          if (!plan) return Promise.resolve();

          // 변경된 것만 업데이트
          const originalData = {
            quantity: plan.quantity,
            start_date: plan.start_date || '',
            end_date: plan.end_date || '',
          };

          // 실제로 변경되었는지 확인
          if (
            formData.quantity === originalData.quantity &&
            formData.start_date === originalData.start_date &&
            formData.end_date === originalData.end_date
          ) {
            return Promise.resolve();
          }

          return createOrUpdateProjectPlan({
            project_id: projectId,
            quotation_product_id: plan.quotation_product.id,
            equipment_id: plan.equipment.id,
            quantity: formData.quantity,
            start_date: formData.start_date,
            end_date: formData.end_date,
            defective_quantity: plan.defective_quantity ?? undefined,
            plan_id: parseInt(planId) > 0 ? parseInt(planId) : undefined,
          });
        }
      );

      await Promise.all(updatePromises);

      // 모든 변경사항 제거
      setFormChanges({});

      // 저장 성공 후 데이터 새로고침 안함
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
      throw error; // 상위에서 처리할 수 있도록 에러 전파
    }
  }, [projectId, formChanges, projectPlans, createOrUpdateProjectPlan]);

  // store에 전체 저장 함수 등록
  useEffect(() => {
    setHandleProductionLogSave(handleSaveAll);
    return () => setHandleProductionLogSave(null);
  }, [handleSaveAll, setHandleProductionLogSave]);

  // 각 행의 유효성 변경 수신 핸들러
  const handleValidityChange = useCallback(
    (planId: number, isValid: boolean) => {
      setRowValidityMap((prev) => ({ ...prev, [planId]: isValid }));
    },
    []
  );

  // rowValidityMap 변경 시 전역 유효성 반영
  useEffect(() => {
    if (!projectPlans.length) return;
    const isAllValid = Object.values(rowValidityMap).every((v) => v);
    setProductionLogValid(isAllValid);
  }, [rowValidityMap, projectPlans.length, setProductionLogValid]);

  // projectPlans 변경 시 production result 완료 상태 업데이트
  useEffect(() => {
    if (!projectPlans.length) {
      setAllProductionResultComplete(false);
      return;
    }
    const isAllProductionResultComplete = projectPlans.every(
      (plan: ProjectPlanModel) =>
        plan.material_consumed === true &&
        plan.defective_quantity !== undefined &&
        plan.defective_quantity !== null
    );
    setAllProductionResultComplete(isAllProductionResultComplete);
  }, [projectPlans, setAllProductionResultComplete]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-100">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="px-10 pt-5 pb-10">
        <div className="flex flex-col w-full overflow-x-auto">
          <ProductionLogTableHeader projectStatus={projectStatus} />
          {projectPlans.length > 0 &&
            projectPlans.map((plan: ProjectPlanModel, index: number) => {
              // 같은 제품의 첫 번째 plan인지 판단
              const isFirstOfProduct =
                index === 0 ||
                projectPlans[index - 1].quotation_product.product.id !==
                  plan.quotation_product.product.id;

              // 실제 변경 여부 판단 (원본 대비 변경된 필드가 하나라도 있으면 true)
              const changed = formChanges[plan.id];
              const hasRealChanges =
                !!changed &&
                (changed.quantity !== plan.quantity ||
                  (changed.start_date || '') !== (plan.start_date || '') ||
                  (changed.end_date || '') !== (plan.end_date || ''));

              return (
                <ProductionLogTableItem
                  key={plan.id}
                  plan={plan}
                  onFormChange={handleFormChange}
                  projectStatus={projectStatus}
                  onSave={() => handleRowSave(plan.id)}
                  hasChanges={hasRealChanges}
                  onValidityChange={handleValidityChange}
                  isFirstOfProduct={isFirstOfProduct}
                  onSaveSuccess={() => {
                    // 자재 재고 수정 시 해당 제품의 plan들만 업데이트
                    updatePlansForProduct(plan.quotation_product.product.id);
                  }}
                />
              );
            })}
        </div>
      </div>

      {/* 생산 계획 저장 토스트 */}
      {isSaveToastOpen && (
        <Toast
          text="생산 계획이 저장되었어요."
          subtext="변경된 내용이 반영되었어요."
          icon={<CheckCircle size={20} className="text-primary" />}
          type="primary"
          isVisible={isSaveToastVisible}
        />
      )}
      {/* 유효한 날짜로 입력 토스트 */}
      {isDateToastOpen && (
        <Toast
          text="유효한 생산 일자나 마감 일자를 입력해 주세요."
          subtext="YYYY-MM-DD 00:00 형식으로 입력해주세요."
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isDateToastVisible}
        />
      )}
    </>
  );
};

export default ProductionLog;
