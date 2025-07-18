import { OperationStatusType, InventoryStatusType } from '@/types/status-type';

export interface ProductionPlanDataModel {
  id: number;
  operationStatus: OperationStatusType;
  productName: string;
  productCode: string;
  size: string;
  unit: string;
  orderQuantity: number;
  productionQuantity: number;
  materialStatus: InventoryStatusType;
  facility: string;
  productionTime: string;
  unitTime: string;
  endDate: string;
}

export const productionPlanData: ProductionPlanDataModel[] = [
  {
    id: 1,
    operationStatus: '가동 대기',
    productName: '플라스틱 컵 A',
    productCode: 'P-001',
    size: '500ml',
    unit: 'EA',
    orderQuantity: 4000,
    productionQuantity: 5200,
    materialStatus: '충분',
    facility: '1호기',
    productionTime: '2025-07-25 09:00',
    unitTime: '10분',
    endDate: '2025-07-26 18:00',
  },
  {
    id: 2,
    operationStatus: '가동 중',
    productName: '플라스틱 뚜껑',
    productCode: 'P-002',
    size: '500ml',
    unit: 'EA',
    orderQuantity: 4000,
    productionQuantity: 1200,
    materialStatus: '부족',
    facility: '2호기',
    productionTime: '2025-07-25 10:00',
    unitTime: '5분',
    endDate: '2025-07-27 12:00',
  },
  {
    id: 3,
    operationStatus: '가동 완료',
    productName: '종이컵',
    productCode: 'PA-001',
    size: '355ml',
    unit: 'EA',
    orderQuantity: 10000,
    productionQuantity: 10000,
    materialStatus: '충분',
    facility: '3호기',
    productionTime: '2025-07-24 09:00',
    unitTime: '2분',
    endDate: '2025-07-25 14:00',
  },
  {
    id: 4,
    operationStatus: '가동 중지',
    productName: '종이컵',
    productCode: 'PA-001',
    size: '355ml',
    unit: 'EA',
    orderQuantity: 10000,
    productionQuantity: 10000,
    materialStatus: '부족',
    facility: '3호기',
    productionTime: '2025-07-24 09:00',
    unitTime: '2분',
    endDate: '2025-07-25 14:00',
  },
];
