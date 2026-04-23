import { apiRequest } from '$lib/interceptor';
import type { TUser } from '$lib/types/user';

export const apiUser = {
	async getProfile() {
		return apiRequest<{ user: TUser }>('/api/user/profile', {
			method: 'GET'
		});
	},

	async changePassword(payload: { old_password: string; new_password: string }) {
		return apiRequest('/api/user/password', {
			method: 'PUT',
			body: JSON.stringify(payload)
		});
	}
};
