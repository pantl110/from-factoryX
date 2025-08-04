import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductionLogTableHeader from './production-log-table-header';
import ProductionLogTableItem from './production-log-table-item';
import useGetProjectPlans from '@/hooks/project/project-plan/use-get-project-plans';
import { ProjectPlanModel } from '@/types/data-model';
import Spinner from '@/ui/spinner';

const ProductionLog = () => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;

  const [projectPlans, setProjectPlans] = useState<ProjectPlanModel[]>([]);
  const { getProjectPlans, isLoading, error } = useGetProjectPlans();

  const loadProjectPlans = async () => {
    if (!projectId) return;

    const result = await getProjectPlans(projectId);
    if (result.success && result.data) {
      setProjectPlans(result.data);
    }
  };

  useEffect(() => {
    loadProjectPlans();
  }, [projectId]);

  if (isLoading || error) {
    return (
      <div className="flex justify-center items-center h-100">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col w-full overflow-x-auto px-10 pt-5 pb-10">
        <ProductionLogTableHeader />
        {projectPlans.length > 0 &&
          projectPlans.map((plan) => (
            <ProductionLogTableItem key={plan.id} plan={plan} />
          ))}
      </div>
    </>
  );
};

export default ProductionLog;
