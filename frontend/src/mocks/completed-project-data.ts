import { CompletedProjectStatusType } from '@/types/status-type'

export interface CompletedProjectDataModel {
  id: number
  status: CompletedProjectStatusType // "완료" | "중단"
  companyName: string
  productName: string
  date: string
}

const completedProjectData: CompletedProjectDataModel[] = [
  {
    id: 11,
    status: '완료',
    companyName: '플라스틱이 좋아',
    productName: '플라스틱 컵 외 3개',
    date: '2025-06-31',
  },
  {
    id: 12,
    status: '완료',
    companyName: '다이몰드',
    productName: '금형케이스',
    date: '2024-06-30',
  },
  {
    id: 13,
    status: '완료',
    companyName: '금형마스터',
    productName: '정밀 부품 외 2개',
    date: '2025-06-31',
  },
  {
    id: 14,
    status: '중단',
    companyName: '테크파츠',
    productName: 'M8 볼트 세트',
    date: '2025-06-31',
  },
]

export default completedProjectData
