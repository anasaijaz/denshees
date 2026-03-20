import { create } from "zustand";
import { persist } from "zustand/middleware";

// Sync read from localStorage to avoid async hydration delay
function getInitialState() {
  if (typeof window === "undefined") {
    return { user: null, token: null, isAuthenticated: false };
  }
  try {
    const raw = localStorage.getItem("auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state;
      if (state?.user && state?.token && state?.isAuthenticated) {
        return {
          user: state.user,
          token: state.token,
          isAuthenticated: true,
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return { user: null, token: null, isAuthenticated: false };
}

const initial = getInitialState();

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: initial.user,
      token: initial.token,
      isAuthenticated: initial.isAuthenticated,

      // Set user data after successful authentication
      setAuth: ({ user, token }) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      // Clear auth data on logout
      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      // Update user data (for profile updates)
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
