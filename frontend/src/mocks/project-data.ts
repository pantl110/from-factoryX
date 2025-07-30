import { ProjectStatusType } from '@/types/status-type';

export interface ProjectDataModel {
  id: number;
  status: ProjectStatusType;
  companyName: string;
  items: string;
  startDate: string;
  endDate: string;
  taxIssued: '보기' | '연결 필요' | '미발행';
  productName?: string;
}

export const projectData: ProjectDataModel[] = [
  {
    id: 1,
    status: 'production',
    companyName: '테크파츠',
    items: 'M8 볼트 세트',
    startDate: '2025-06-06',
    endDate: '2025-06-11',
    taxIssued: '연결 필요',
    productName: 'M8 볼트 세트',
  },
  {
    id: 2,
    status: 'manufactured',
    companyName: '에이스정밀',
    items: '금형 케이스',
    startDate: '2025-06-04',
    endDate: '2025-06-15',
    taxIssued: '미발행',
    productName: '플라스틱 뚜껑',
  },
  {
    id: 3,
    status: 'pending',
    companyName: '에이스정밀',
    items: '성일 부품 외 2개',
    startDate: '2025-06-12',
    endDate: '2025-06-11',
    taxIssued: '미발행',
    productName: '플라스틱 고리',
  },
  {
    id: 4,
    status: 'delivery',
    companyName: '디이몰드',
    items: '테스크 키트 외 1개',
    startDate: '2025-06-04',
    endDate: '2025-06-10',
    taxIssued: '연결 필요',
    productName: '테스크 키트',
  },
  {
    id: 5,
    status: 'quotation',
    companyName: '다이몰드',
    items: '정밀 부품 외 2개',
    startDate: '-',
    endDate: '2025-06-15',
    taxIssued: '보기',
    productName: '정밀 부품',
  },
  {
    id: 6,
    status: 'production',
    companyName: '금형마스터',
    items: '금형 케이스',
    startDate: '2025-06-04',
    endDate: '2025-06-13',
    taxIssued: '보기',
    productName: '플라스틱 고리',
  },
  {
    id: 7,
    status: 'delivery',
    companyName: '플라스틱이 좋아',
    items: '플라스틱 컵 외 3개',
    startDate: '2025-06-08',
    endDate: '2025-06-14',
    taxIssued: '보기',
    productName: '플라스틱 컵',
  },
  {
    id: 8,
    status: 'completed',
    companyName: '플라스틱이 좋아',
    items: '플라스틱 컵 외 3개',
    startDate: '2025-06-08',
    endDate: '2025-06-14',
    taxIssued: '보기',
    productName: '플라스틱 컵',
  },
  {
    id: 9,
    status: 'quotation',
    companyName: '메탈리카',
    items: '정밀 부품 외 2개',
    startDate: '-',
    endDate: '2025-06-15',
    taxIssued: '보기',
    productName: '정밀 부품',
  },
];
