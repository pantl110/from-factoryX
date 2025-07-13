import { FacilityStatusType } from '@/app/(with-layout)/setting/master-data/facility/types'

export interface FacilityDataModel {
  id: number
  status: FacilityStatusType
  name: string
  priority: number | null
  location: string
}

export const facilityData: FacilityDataModel[] = [
  {
    id: 1,
    status: '가동 중',
    name: '1호기',
    priority: 1,
    location: '1층 생산동 A라인',
  },
  {
    id: 2,
    status: '가동 대기',
    name: '2호기',
    priority: 2,
    location: '1층 생산동 A라인',
  },
  {
    id: 3,
    status: '가동 중',
    name: '3호기',
    priority: 3,
    location: '1층 생산동 B라인',
  },
  {
    id: 4,
    status: '가동 대기',
    name: '4호기',
    priority: 4,
    location: '1층 생산동 C라인',
  },
  {
    id: 5,
    status: '가동 대기',
    name: '5호기',
    priority: 5,
    location: '1층 생산동 D라인',
  },
]
