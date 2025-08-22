import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MemberStoreModel {
  factoryId: number | null;
  role: string | null;
  isBarobillUser: boolean | null;
  setFactoryId: (id: number) => void;
  setRole: (role: string) => void;
  setIsBarobillUser: (isBarobillUser: boolean) => void;
  initializeFactoryId: () => Promise<void>;
  clearFactoryId: () => void;
  clearRole: () => void;
  clearIsBarobillUser: () => void;
}

const useMemberStore = create<MemberStoreModel>()(
  persist(
    (set, get) => ({
      factoryId: null,
      role: null,
      isBarobillUser: null,
      setFactoryId: (id) => {
        set({ factoryId: id });
      },
      setRole: (role) => {
        set({ role });
      },
      setIsBarobillUser: (isBarobillUser) => {
        set({ isBarobillUser });
      },
      initializeFactoryId: async () => {
        const currentFactoryId = get().factoryId;

        // 이미 설정되어 있으면 스킵
        if (currentFactoryId !== null) return;

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/factory`,
            {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const result = await response.json();
            const factories = result.data;

            if (factories.length > 0) {
              const firstFactoryId = factories[0].id;
              set({ factoryId: firstFactoryId });
            }
          }
        } catch {
          // API 호출 실패 시 무시
        }
      },
      clearFactoryId: () => {
        set({ factoryId: null });
      },
      clearRole: () => {
        set({ role: null });
      },
      clearIsBarobillUser: () => {
        set({ isBarobillUser: null });
      },
    }),
    {
      name: 'member-storage', // 로컬 스토리지에 저장될 키 이름
      partialize: (state) => ({
        factoryId: state.factoryId,
        role: state.role,
        isBarobillUser: state.isBarobillUser,
      }), // factoryId, role, isBarobillUser 저장
    }
  )
);

export default useMemberStore;
