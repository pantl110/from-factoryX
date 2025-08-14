import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ProductionLogTableHeader from './production-log-table-header';
import ProductionLogTableItem from './production-log-table-item';
import { useUpdateProjectPlan, useGetProjectPlans } from '@/hooks';
import { ProjectPlanModel } from '@/types/data-model';
import { ProjectStatusType } from '@/types/status-type';
import Spinner from '@/ui/spinner';

interface ProductionLogProps {
  projectStatus: ProjectStatusType;
}

const ProductionLog = ({ projectStatus }: ProductionLogProps) => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;

  const [projectPlans, setProjectPlans] = useState<ProjectPlanModel[]>([]);
  const { getProjectPlans, isLoading } = useGetProjectPlans();
  const { updateProjectPlan } = useUpdateProjectPlan();

  // 디바운스 타이머 저장
  const [debounceTimers, setDebounceTimers] = useState<
    Record<number, NodeJS.Timeout>
  >({});

  const loadProjectPlans = useCallback(async () => {
    if (!projectId) return;

    const result = await getProjectPlans(projectId);
    if (result.success && result.data) {
      setProjectPlans(result.data);
    }
  }, [projectId, getProjectPlans]);

  useEffect(() => {
    loadProjectPlans();
  }, [loadProjectPlans]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, [debounceTimers]);

  // 생산수량, 날짜 변경 핸들러 (디바운스 적용)
  const handleFormChange = useCallback(
    (
      planId: number,
      formData: { quantity: number; start_date: string; end_date: string }
    ) => {
      setDebounceTimers((prevTimers) => {
        if (prevTimers[planId]) clearTimeout(prevTimers[planId]);
        const newTimer = setTimeout(async () => {
          try {
            const result = await updateProjectPlan(planId, formData);
            if (result.success) {
              // 성공 시 데이터 새로고침
              await loadProjectPlans();
            }
          } catch {
            alert('날짜 변경 중 오류가 발생했습니다.');
          }
        }, 1000); // 1초 디바운스
        return { ...prevTimers, [planId]: newTimer };
      });
    },
    [updateProjectPlan, loadProjectPlans]
  );

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
          <ProductionLogTableHeader />
          {projectPlans.length > 0 &&
            projectPlans.map((plan) => (
              <ProductionLogTableItem
                key={plan.id}
                plan={plan}
                onFormChange={handleFormChange}
                projectStatus={projectStatus}
              />
            ))}
        </div>
      </div>
    </>
  );
};

export default ProductionLog;
