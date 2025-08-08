export type OnboardingStepType =
  | 'choosing-role'
  | 'welcome'
  | 'first-step'
  | 'second-step'
  | 'third-step';

export interface FirstStepFormDataModel {
  productName: string;
  productCode: string;
  size: string;
  unit: string;
}

// second-step // 개별 자재 항목 타입
export interface MaterialItemModel {
  materialName: string;
  size: string;
  usageQuantity: number | '';
}

// second-step // 전체 폼 데이터 타입
export interface SecondStepFormDataModel {
  materials: MaterialItemModel[];
}
