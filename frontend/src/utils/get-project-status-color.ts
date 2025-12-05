import { ProjectStatusType } from '@/types/status-type';

type RoundChipColor =
  | 'primary'
  | 'secondary'
  | 'red'
  | 'green'
  | 'orange'
  | 'yellow'
  | 'purple'
  | 'gray';

/**
 * 프로젝트 상태를 RoundChip color로 매핑하는 함수
 * @param status 프로젝트 상태
 * @returns RoundChip color
 */
export const getProjectStatusColor = (
  status: string | ProjectStatusType
): RoundChipColor => {
  const colorMap: Record<string, RoundChipColor> = {
    quotation: 'yellow',
    confirmed: 'orange',
    pending: 'gray',
    production: 'purple',
    manufactured: 'secondary',
    delivery: 'green',
    completed: 'secondary',
    suspended: 'red',
  };
  return colorMap[status] || 'gray';
};
