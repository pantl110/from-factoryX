import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SubscriptionInfoModel {
  id: number | null;
  created_at: string | null;
  updated_at: string | null;
  start_date: string | null;
  end_date: string | null;
  is_canceled: boolean | null;
  type?: 'basic' | 'partners' | 'trial' | null;
  is_active?: boolean | null;
}

interface SubscriptionStoreModel {
  subscription: SubscriptionInfoModel | null;
  setSubscription: (subscription: SubscriptionInfoModel) => void;
  clearSubscription: () => void;
  isPartnersSubscription: () => boolean;
  hasSubscription: () => boolean;
}

const useSubscriptionStore = create<SubscriptionStoreModel>()(
  persist(
    (set, get) => ({
      subscription: null,

      setSubscription: (subscription) => {
        set({ subscription });
      },

      clearSubscription: () => {
        set({ subscription: null });
        // localStorage에서도 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('subscription-storage');
        }
      },

      isPartnersSubscription: () => {
        const { subscription } = get();
        return (
          subscription?.type === 'partners' && subscription?.is_active === true
        );
      },

      hasSubscription: () => {
        const { subscription } = get();
        const hasActiveSubscription = subscription?.is_active === true;
        return hasActiveSubscription === true;
      },
    }),
    {
      name: 'subscription-storage', // 로컬 스토리지 키 이름
      partialize: (state) => ({
        subscription: state.subscription,
      }),
    }
  )
);

export default useSubscriptionStore;
