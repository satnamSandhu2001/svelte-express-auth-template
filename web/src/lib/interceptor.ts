import type { ApiResponse } from '$lib/types/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Track if a refresh is in progress to avoid multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Clear authentication state
 * This is called when token refresh fails to prevent redirect loops
 */
function clearAuthState() {
	// Dispatch custom event to notify auth store to clear user
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('auth:clear'));
	}
}

/**
 * Redirect to login page with current URL as redirect parameter
 */
function redirectToLogin() {
	if (typeof window !== 'undefined') {
		const currentPath = window.location.pathname + window.location.search;
		// Don't redirect if already on login page
		if (currentPath.startsWith('/login')) {
			return;
		}
		const loginUrl = `/login?expired=true&redirect=${encodeURIComponent(currentPath)}`;
		window.location.href = loginUrl;
	}
}

/**
 * Attempts to refresh the authentication tokens
 * @returns Promise<boolean> - true if refresh successful, false otherwise
 */
async function refreshTokens(): Promise<boolean> {
	// If already refreshing, return the existing promise
	if (isRefreshing && refreshPromise) {
		return refreshPromise;
	}

	isRefreshing = true;
	refreshPromise = (async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
				method: 'POST',
				credentials: 'include'
			});

			const data = await response.json();

			if (data.success) {
				return true;
			}

			console.error('Token refresh failed:', data.message);
			// Clear auth state on refresh failure
			clearAuthState();
			return false;
		} catch (error) {
			console.error('Token refresh error:', error);
			// Clear auth state on error
			clearAuthState();
			return false;
		} finally {
			isRefreshing = false;
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
	retryCount = 0
): Promise<ApiResponse<T>> {
	const url = `${API_BASE_URL}${endpoint}`;

	const defaultHeaders: HeadersInit = {};
	if (options.body && !(options.body instanceof FormData)) {
		defaultHeaders['Content-Type'] = 'application/json';
	}

	const config: RequestInit = {
		...options,
		headers: {
			...defaultHeaders,
			...options.headers
		},
		credentials: 'include'
	};

	try {
		const response = await fetch(url, config);
		const data = await response.json().catch(() => ({
			success: false,
			message: 'Invalid response from server'
		}));

		// If we get a 401 Unauthorized and haven't retried yet, try to refresh
		// But skip refresh if we're already on the login page to prevent loops
		const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

		if (response.status === 401 && retryCount === 0 && !isOnLoginPage) {
			const refreshSuccess = await refreshTokens();

			if (refreshSuccess) {
				// Retry the original request with new tokens
				return apiRequest<T>(endpoint, options, retryCount + 1);
			} else {
				// Refresh failed, redirect to login with current page as redirect
				redirectToLogin();
			}
		}

		return data;
	} catch (error: any) {
		console.error('API Request Error:', error);
		return {
			success: false,
			message: error.message || 'Something went wrong'
		} as ApiResponse<T>;
	}
}

export type BlobResponse = {
	type: 'blob';
	blob: Blob;
	filename: string;
};

export type BlobErrorResponse = {
	type: 'error';
} & ApiResponse<unknown>;

/**
 * API request for blob/file downloads with automatic token refresh
 */
export async function apiRequestBlob(
	endpoint: string,
	options: RequestInit = {},
	retryCount = 0
): Promise<BlobResponse | BlobErrorResponse> {
	const url = `${API_BASE_URL}${endpoint}`;

	const defaultHeaders: HeadersInit = {};

	const config: RequestInit = {
		...options,
		headers: {
			...defaultHeaders,
			...options.headers
		},
		credentials: 'include'
	};

	try {
		const response = await fetch(url, config);

		// Handle 401 with token refresh
		// But skip refresh if we're already on the login page to prevent loops
		const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

		if (response.status === 401 && retryCount === 0 && !isOnLoginPage) {
			const refreshSuccess = await refreshTokens();

			if (refreshSuccess) {
				return apiRequestBlob(endpoint, options, retryCount + 1);
			} else {
				redirectToLogin();
				return {
					type: 'error',
					success: false,
					message: 'Authentication failed'
				} as BlobErrorResponse;
			}
		}

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Something went wrong');
		}

		const data = await response.blob();
		const disposition = response.headers.get('content-disposition');
		const filename = disposition?.split('=')[1].replaceAll('"', '') ?? 'download';

		return { type: 'blob', blob: data as Blob, filename };
	} catch (error: any) {
		console.log('API Request Error:', error);
		return {
			type: 'error',
			success: false,
			message: error.message || 'Something went wrong'
		} as BlobErrorResponse;
	}
}

/**
 * Upload files with progress tracking and automatic token refresh
 */
export async function uploadWithProgress<T = unknown>(
	endpoint: string,
	formData: FormData,
	onProgress?: (progress: number) => void,
	retryCount = 0
): Promise<ApiResponse<T>> {
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		const url = `${API_BASE_URL}${endpoint}`;

		xhr.timeout = 30000;

		if (onProgress) {
			xhr.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					const progress = Math.round((e.loaded / e.total) * 100);
					onProgress(progress);
				}
			});
		}

		xhr.addEventListener('loadstart', () => {
			console.log('Upload started...');
		});

		xhr.addEventListener('load', async () => {
			// Handle 401 with token refresh
			// But skip refresh if we're already on the login page to prevent loops
			const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

			if (xhr.status === 401 && retryCount === 0 && !isOnLoginPage) {
				const refreshSuccess = await refreshTokens();

				if (refreshSuccess) {
					const retryResult = await uploadWithProgress<T>(
						endpoint,
						formData,
						onProgress,
						retryCount + 1
					);
					resolve(retryResult);
					return;
				} else {
					redirectToLogin();
					resolve({
						success: false,
						message: 'Authentication failed'
					} as ApiResponse<T>);
					return;
				}
			}

			try {
				const response: ApiResponse<T> = JSON.parse(xhr.responseText);
				resolve(response);
			} catch (error) {
				console.error('Failed to parse response:', error);
				resolve({
					success: false,
					message: 'Invalid response from server'
				} as ApiResponse<T>);
			}
		});

		xhr.addEventListener('error', (e) => {
			console.error('Network error:', e);
			resolve({
				success: false,
				message: 'Network error occurred'
			} as ApiResponse<T>);
		});

		xhr.addEventListener('timeout', () => {
			console.error('Request timeout');
			resolve({
				success: false,
				message: 'Upload timeout'
			} as ApiResponse<T>);
		});

		xhr.open('POST', url);
		xhr.withCredentials = true;

		console.log('Sending request...');
		xhr.send(formData);
	});
}
