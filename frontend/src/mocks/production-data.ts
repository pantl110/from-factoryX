export interface ProductionDataModel {
  id: number
  projectName: string
  productName: string
  productCode?: string
  standard: string
  unit: string
  orderQuantity?: number
  productionQuantity?: number
  machine?: string
  productionTime?: string
  unitTime?: number
  materialStatus?: '충분' | '부족'
  endDate?: string
}

export const productionData: ProductionDataModel[] = [
  {
    id: 1,
    projectName: '프로젝트 1',
    productName: 'A품목',
    productCode: 'P-001',
    standard: '500ml',
    unit: 'EA',
    orderQuantity: 500,
    productionQuantity: 4300,
    machine: '1호기',
    productionTime: '13:50',
    unitTime: 30,
    materialStatus: '충분',
    endDate: '2025-06-20 16:30',
  },
  {
    id: 2,
    projectName: '프로젝트 2',
    productName: 'B품목',
    productCode: 'P-002',
    standard: '500ml',
    unit: 'EA',
    orderQuantity: 500,
    productionQuantity: 4300,
    machine: '1호기',
    productionTime: '13:50',
    unitTime: 30,
    materialStatus: '충분',
    endDate: '2025-06-20 16:30',
  },
  {
    id: 3,
    projectName: '프로젝트 3',
    productName: 'C품목',
    productCode: 'P-003',
    standard: '500ml',
    unit: 'EA',
    orderQuantity: 500,
    productionQuantity: 4300,
    machine: '2호기',
    productionTime: '13:50',
    unitTime: 30,
    materialStatus: '부족',
    endDate: '2025-06-20 16:30',
  },
  {
    id: 4,
    projectName: '프로젝트 4',
    productName: 'D품목',
    productCode: 'P-004',
    standard: '500ml',
    unit: 'EA',
    orderQuantity: 500,
    productionQuantity: 4300,
    machine: '2호기',
    productionTime: '13:50',
    unitTime: 30,
    materialStatus: '충분',
    endDate: '2025-06-20 16:30',
  },
  {
    id: 5,
    projectName: '프로젝트 1',
    productName: 'D품목',
    productCode: 'P-004',
    standard: '500ml',
    unit: 'EA',
    orderQuantity: 500,
    productionQuantity: 4300,
    machine: '2호기',
    productionTime: '13:50',
    unitTime: 30,
    materialStatus: '충분',
    endDate: '2025-06-20 16:30',
  },
]
