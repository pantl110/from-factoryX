export type PlanType = 'FREE' | 'BASIC' | 'PARTNERS';

export interface PlanInfoModel {
  type: PlanType;
  title: string;
  price: number;
  description: string;
}

export interface SubscriptionModel {
  id: string;
  planType: PlanType;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';
  autoRenew: boolean;
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  cardInfo?: {
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
}

export interface PaymentHistoryModel {
  id: string;
  date: string;
  card: string;
  amount: string;
  plan: PlanType;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export const PLAN_INFO: Record<
  PlanType,
  Omit<PlanInfoModel, 'title' | 'description'>
> = {
  FREE: {
    type: 'FREE',
    price: 0,
  },
  BASIC: {
    type: 'BASIC',
    price: 110000,
  },
  PARTNERS: {
    type: 'PARTNERS',
    price: 300000,
  },
};
