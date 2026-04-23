import { apiRequest } from '$lib/interceptor';
import type { TUser } from '$lib/types/user';

export const apiAuth = {
	async login(credentials: { email: string; password: string }) {
		return apiRequest<{ user: TUser }>('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify(credentials)
		});
	},

	async logout() {
		return apiRequest('/api/auth/logout', {
			method: 'GET'
		});
	}
};
