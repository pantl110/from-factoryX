import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SubscriptionInfoModel {
  id: number;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date: string;
  is_canceled: boolean;
  type?: 'basic' | 'partners';
  is_active?: boolean;
}

interface SubscriptionStoreModel {
  subscription: SubscriptionInfoModel | null;
  setSubscription: (subscription: SubscriptionInfoModel) => void;
  clearSubscription: () => void;
  isPartnersSubscription: () => boolean;
  isActiveSubscription: () => boolean;
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

      isActiveSubscription: () => {
        const { subscription } = get();
        return subscription?.is_active === true && !subscription?.is_canceled;
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
