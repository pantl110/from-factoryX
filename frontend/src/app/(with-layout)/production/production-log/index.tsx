import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ProductionLogTableHeader from './production-log-table-header';
import ProductionLogTableItem from './production-log-table-item';
import { useCreateOrUpdateProjectPlan, useGetProjectPlans } from '@/hooks';
import { ProjectPlanModel } from '@/types/data-model';
import { ProjectStatusType } from '@/types/status-type';
import Spinner from '@/ui/spinner';
import usePageStatusStore from '@/store/page-status-store';

interface ProductionLogProps {
  projectStatus: ProjectStatusType;
}

const ProductionLog = ({ projectStatus }: ProductionLogProps) => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;

  const [projectPlans, setProjectPlans] = useState<ProjectPlanModel[]>([]);
  const { getProjectPlans, isLoading } = useGetProjectPlans();
  const { createOrUpdateProjectPlan } = useCreateOrUpdateProjectPlan();

  // store에서 함수들 가져오기
  const setHandleProductionLogSave = usePageStatusStore(
    (state) => state.setHandleProductionLogSave
  );
  const setProductionLogValid = usePageStatusStore(
    (state) => state.setProductionLogValid
  );

  // 폼 변경사항을 추적하는 상태
  const [formChanges, setFormChanges] = useState<
    Record<number, { quantity: number; start_date: string; end_date: string }>
  >({});

  // 각 행의 유효성 상태를 추적 (React Hook Form에서 전달)
  const [rowValidityMap, setRowValidityMap] = useState<Record<number, boolean>>(
    {}
  );

  const loadProjectPlans = useCallback(async () => {
    if (!projectId) return;

    const result = await getProjectPlans(projectId);
    if (result.success && result.data) {
      setProjectPlans(result.data);

      // formChanges를 원본 데이터로 초기화
      const initialFormData: Record<
        number,
        { quantity: number; start_date: string; end_date: string }
      > = {};
      result.data.forEach((plan: ProjectPlanModel) => {
        initialFormData[plan.id] = {
          quantity: plan.quantity,
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

      // 초기 유효성 상태 리셋
      const initialValidity: Record<number, boolean> = {};
      result.data.forEach((plan: ProjectPlanModel) => {
        initialValidity[plan.id] = true; // 초기값은 true로 두고, 각 행에서 업데이트됨
      });
      setRowValidityMap(initialValidity);
      setProductionLogValid(true);
    }
  }, [projectId, getProjectPlans, setProductionLogValid]);

  useEffect(() => {
    loadProjectPlans();
  }, [loadProjectPlans]);

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

      const plan = projectPlans.find((p) => p.id === planId);
      if (!plan) return;

      // 원본 데이터와 비교하여 실제로 변경되었는지 확인
      const originalData = {
        quantity: plan.quantity,
        start_date: plan.start_date
          ? new Date(plan.start_date)
              .toISOString()
              .slice(0, 16)
              .replace('T', ' ')
          : '',
        end_date: plan.end_date
          ? new Date(plan.end_date).toISOString().slice(0, 16).replace('T', ' ')
          : '',
      };

      if (
        formData.quantity === originalData.quantity &&
        formData.start_date === originalData.start_date &&
        formData.end_date === originalData.end_date
      ) {
        return;
      }

      try {
        const result = await createOrUpdateProjectPlan({
          project_id: projectId,
          quotation_product_id: plan.quotation_product.id,
          equipment_id: plan.equipment.id,
          quantity: formData.quantity,
          start_date: formData.start_date,
          end_date: formData.end_date,
          avg_production_time: plan.avg_production_time,
          plan_id: planId > 0 ? planId : undefined,
        });

        if (result.success) {
          // 저장 성공 시 해당 행의 변경사항 제거
          setFormChanges((prev) => {
            const { [planId]: removed, ...rest } = prev;
            return rest;
          });

          // 데이터 새로고침
          await loadProjectPlans();
        } else {
          alert('저장에 실패했습니다.');
        }
      } catch (error) {
        alert('저장 중 오류가 발생했습니다.');
      }
    },
    [
      projectId,
      formChanges,
      projectPlans,
      createOrUpdateProjectPlan,
      loadProjectPlans,
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
          const plan = projectPlans.find((p) => p.id === parseInt(planId));
          if (!plan) return Promise.resolve();

          // 변경된 것만 업데이트
          const originalData = {
            quantity: plan.quantity,
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
            avg_production_time: plan.avg_production_time,
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
  }, [
    projectId,
    formChanges,
    projectPlans,
    createOrUpdateProjectPlan,
    rowValidityMap,
  ]);

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
    const allValid = Object.values(rowValidityMap).every((v) => v);
    setProductionLogValid(allValid);
  }, [rowValidityMap, projectPlans.length, setProductionLogValid]);

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
            projectPlans.map((plan) => (
              <ProductionLogTableItem
                key={plan.id}
                plan={plan}
                onFormChange={handleFormChange}
                projectStatus={projectStatus}
                onSave={() => handleRowSave(plan.id)}
                hasChanges={!!formChanges[plan.id]}
                onValidityChange={handleValidityChange}
              />
            ))}
        </div>
      </div>
    </>
  );
};

export default ProductionLog;
