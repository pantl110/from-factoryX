export type FacilityStatusType = '가동 중' | '가동 대기'

export const FacilityStatusColorMap: Record<
  FacilityStatusType,
  { bgColor: string; textColor: string }
> = {
  '가동 중': { bgColor: 'bg-purple-8', textColor: 'text-purple' },
  '가동 대기': { bgColor: 'bg-bg', textColor: 'text-dg' },
}
