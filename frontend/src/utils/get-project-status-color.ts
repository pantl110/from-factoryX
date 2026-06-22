import {
  ProjectStatusColorMap,
  ProjectStatusType,
  StatusColorModel,
} from '@/types/status-type';

type RoundChipColorType = NonNullable<StatusColorModel['color']>;

/**
 * 프로젝트 상태를 RoundChip color로 매핑하는 함수
 * 색상의 단일 출처(SSOT)는 ProjectStatusColorMap이며, 이 함수는 거기서 color를 읽어온다.
 * @param status 프로젝트 상태 (영문 키 또는 한글 호환 키)
 * @returns RoundChip color
 */
export const getProjectStatusColor = (
  status: string | ProjectStatusType
): RoundChipColorType => {
  return ProjectStatusColorMap[status]?.color ?? 'gray';
};
