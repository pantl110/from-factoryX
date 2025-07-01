export type OnboardingStepType =
  | "welcome"
  | "first-step"
  | "second-step"
  | "third-step";

export interface FirstStepFormDataModel {
  productName: string;
  productCode: string;
  size: string;
  unit: string;
}
