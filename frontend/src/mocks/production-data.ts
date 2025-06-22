export interface ProductionDataModel {
  id: number;
  productName: string;
  standard: string;
  unit: string;
  quantity: number;
  machine: string;
  productionTime: string;
}

export const productionData: ProductionDataModel[] = [
  {
    id: 1,
    productName: "A품목",
    standard: "500ml",
    unit: "EA",
    quantity: 500,
    machine: "1호기",
    productionTime: "2025-06-19 13:50",
  },
  {
    id: 2,
    productName: "B품목",
    standard: "500ml",
    unit: "EA",
    quantity: 500,
    machine: "1호기",
    productionTime: "2025-06-19 13:50",
  },
  {
    id: 3,
    productName: "C품목",
    standard: "500ml",
    unit: "EA",
    quantity: 500,
    machine: "2호기",
    productionTime: "2025-06-19 13:50",
  },
  {
    id: 4,
    productName: "D품목",
    standard: "500ml",
    unit: "EA",
    quantity: 500,
    machine: "2호기",
    productionTime: "2025-06-19 13:50",
  },
];
