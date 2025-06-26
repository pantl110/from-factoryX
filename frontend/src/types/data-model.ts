export interface MaterialModel {
  id: number;
  materialName: string;
  usageQuantity: string;
}

export interface ProductDataModel {
  id: number;
  productName: string;
  productCode: string;
  size: string;
  unit: string;
  stock: number;
  productionTime: string;
  location?: string;
  comment?: string[];
  returnQuantity?: number;
}
