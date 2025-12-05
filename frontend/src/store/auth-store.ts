import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserInfoModel } from '@/types/data-model';

interface AuthStateProps {
  userInfo: UserInfoModel | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  setUserInfo: (userInfo: UserInfoModel | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoggingOut: (isLoggingOut: boolean) => void;
  clearAuth: () => void;
  fetchUserInfo: () => Promise<boolean>;
  initializeAuth: () => void;
}

const useAuthStore = create<AuthStateProps>()(
  persist(
    (set) => ({
      userInfo: null,
      isLoading: false,
      isAuthenticated: false,
      isLoggingOut: false,

      setUserInfo: (userInfo) => {
        set({
          userInfo,
          isAuthenticated: !!userInfo,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      setLoggingOut: (isLoggingOut) => set({ isLoggingOut }),

      clearAuth: () => {
        // 1. 먼저 상태 초기화 (isLoggingOut은 유지 - 로그아웃 중 빈 화면 표시를 위해)
        set({
          userInfo: null,
          isAuthenticated: false,
          isLoading: false,
          // isLoggingOut은 유지 - router.push 후에 초기화
        });

        // 2. 그 다음 localStorage 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
      },

      initializeAuth: () => {
        // persist 미들웨어가 자동으로 상태를 복원하므로 별도 로직 불필요
        // 단, 로딩 상태만 해제
        set({ isLoading: false });
      },

      fetchUserInfo: async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`,
            {
              method: 'GET',
              credentials: 'include', // 쿠키 자동 전송
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const userData: UserInfoModel = await response.json();
            set({
              userInfo: userData,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            set({
              userInfo: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return false;
          }
        } catch {
          set({
            userInfo: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage에 저장될 키 이름
      partialize: (state) => ({
        // 민감하지 않은 정보만 저장
        userInfo: state.userInfo,
        isAuthenticated: state.isAuthenticated,
        isLoading: false, // 새로고침 시 로딩 상태 해제
      }),
    }
  )
);

export default useAuthStore;
