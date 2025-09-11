import { ProjectResponseModel } from '@/types/data-model';

export const getStartDate = (project: ProjectResponseModel) => {
  const startDate =
    project.plans && project.plans.length > 0
      ? project.plans
          .reduce((earliest, plan) => {
            if (!earliest) return plan.start_date;
            return plan.start_date < earliest ? plan.start_date : earliest;
          }, project.plans[0].start_date)
          .split('T')[0]
      : '-';

  return startDate;
};
