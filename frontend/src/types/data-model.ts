export interface MaterialModel {
  id: number;
  materialName: string;
  usageQuantity: string;
}

export interface ProductDataModel {
  id: number | null;
  productName: string;
  productCode?: string;
  size: string;
  unit: string;
  stock?: number;
  productionTime?: string;
  location?: string;
  comment?: string[];
  returnQuantity?: number;
  [key: string]: unknown;
}

export interface MaterialDataModel {
  id: string;
  materialName: string;
  size: string;
  usageQuantity?: number | null;
  unitPrice?: number | null;
  unit?: string;
  [key: string]: unknown;
}

import { ClientType } from "@/app/(with-layout)/setting/master-data/client/types";
export interface ClientDataModel {
  id: string;
  type: ClientType;
  companyName: string;
  businessNumber: string;
  representativeName: string;
  dueDate: string;
  businessType?: string; // 업태
  businessCategory?: string; // 종목
  companyAddress: string;
  responsibleName: string;
  email: string;
  contact?: string;
  fax?: string;
  deliveryAddress?: string;
  comment?: string;
  [key: string]: unknown;
}
