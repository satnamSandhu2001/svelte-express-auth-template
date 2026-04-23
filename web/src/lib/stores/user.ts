import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { TUser } from '$lib/types/user';
import { apiUser } from '$lib/service/user';
import { apiAuth } from '$lib/service/auth';

interface AuthState {
	user: TUser | null;
	isLoading: boolean;
	error: string | null;
}

const createUserStore = () => {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		isLoading: true,
		error: null
	});

	// Listen for auth clear events from interceptor (when refresh token fails)
	if (browser) {
		window.addEventListener('auth:clear', () => {
			set({
				user: null,
				isLoading: false,
				error: null
			});
		});
	}

	return {
		subscribe,

		async init() {
			if (!browser) {
				set({
					user: null,
					isLoading: false,
					error: null
				});
				return;
			}

			update((state) => ({ ...state, isLoading: true }));
			try {
				const response = await apiUser.getProfile();
				if (response.success && response.data) {
					set({
						user: response.data.user,
						isLoading: false,
						error: null
					});
				} else {
					set({
						user: null,
						isLoading: false,
						error: null
					});
				}
			} catch (_error) {
				set({
					user: null,
					isLoading: false,
					error: null
				});
			}
		},

		async login(email: string, password: string) {
			update((state) => ({ ...state, isLoading: true, error: null }));
			try {
				const response = await apiAuth.login({ email, password });
				console.log(response);
				if (response.success && response.data) {
					set({
						user: response.data.user,
						isLoading: false,
						error: null
					});
					return true;
				} else {
					update((state) => ({
						...state,
						isLoading: false,
						error: response.message || 'Login failed'
					}));
					return false;
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Login failed';
				update((state) => ({
					...state,
					isLoading: false,
					error: message
				}));
				return false;
			}
		},

		async logout() {
			try {
				await apiAuth.logout();
			} catch (error) {
				console.error('Logout error:', error);
			} finally {
				set({
					user: null,
					isLoading: false,
					error: null
				});
			}
		},

		clearError() {
			update((state) => ({ ...state, error: null }));
		},

		clearUser() {
			set({
				user: null,
				isLoading: false,
				error: null
			});
		}
	};
};

export const userStore = createUserStore();
