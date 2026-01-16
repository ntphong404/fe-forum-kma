import { create } from 'zustand';
import { User } from '@/interfaces/auth.types';
import { AuthService } from '../features/auth/services/auth.service';

// Helper function to check if user is admin
export const isUserAdmin = (user: User | null): boolean => {
    if (!user) return false;

    // Check roleName
    if (user.roleName?.toLowerCase() === 'admin') return true;

    // Check roles array
    if (user.roles?.some(role => role.toLowerCase() === 'admin')) return true;

    return false;
};

// Auth Store
type AuthState = {
    isLoggedIn: boolean;
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    setUser: (user: User) => void;
    initAuth: () => void;
    isAdmin: () => boolean;
    _hasHydrated: boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
    isLoggedIn: false,
    user: null,
    _hasHydrated: false,
    login: (user: User) => set({
        isLoggedIn: true,
        user
    }),
    logout: () => {
        // Clear state immediately for better UX
        set({ isLoggedIn: false, user: null });
        // Call API logout in background (don't block UI)
        AuthService.logout().catch((error) => {
            console.error('Logout API error:', error);
        });
    },
    setUser: (user: User) => set({ user, isLoggedIn: true }),
    initAuth: () => {
        const user = AuthService.getCurrentUser();
        const isAuthenticated = AuthService.isAuthenticated();
        set({ user, isLoggedIn: isAuthenticated, _hasHydrated: true });
    },
    isAdmin: () => isUserAdmin(get().user),
}));
