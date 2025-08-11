import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FactoryStoreModel {
  factoryId: number | null;
  setFactoryId: (id: number) => void;
  initializeFactoryId: () => Promise<void>;
  clearFactoryId: () => void;
}

const useFactoryStore = create<FactoryStoreModel>()(
  persist(
    (set, get) => ({
      factoryId: null,
      setFactoryId: (id) => {
        set({ factoryId: id });
      },
      initializeFactoryId: async () => {
        const currentFactoryId = get().factoryId;

        // 이미 설정되어 있으면 스킵
        if (currentFactoryId !== null) return;

        // API에서 공장 목록 가져오기
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
    }),
    {
      name: 'factory-storage', // 로컬 스토리지에 저장될 키 이름
      partialize: (state) => ({ factoryId: state.factoryId }), // factoryId만 저장
    }
  )
);

export default useFactoryStore;
