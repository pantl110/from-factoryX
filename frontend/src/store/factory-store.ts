import { create } from 'zustand'

interface FactoryStoreModel {
  factoryId: number | null
  setFactoryId: (id: number) => void
}

const useFactoryStore = create<FactoryStoreModel>((set) => ({
  factoryId: null,
  setFactoryId: (id) => set({ factoryId: id }),
}))

export default useFactoryStore
