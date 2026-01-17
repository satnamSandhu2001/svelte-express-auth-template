import type { ApiResponse } from '$lib/types/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
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

export async function apiRequestBlob(
	endpoint: string,
	options: RequestInit = {}
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

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Something went wrong');
		}

		const data = await response.blob();
		const disposition = response.headers.get('content-disposition');
		const filename = disposition?.split('=')[1].replaceAll('"', '') ?? 'download';
		console.log({ disposition, filename });

		return { type: 'blob', blob: data as Blob, filename };
	} catch (error: any) {
		console.error('API Request Error:', error);
		return {
			type: 'error',
			success: false,
			message: error.message || 'Something went wrong'
		} as BlobErrorResponse;
	}
}

//  Upload files with progress tracking
export async function uploadWithProgress<T = unknown>(
	endpoint: string,
	formData: FormData,
	onProgress?: (progress: number) => void
): Promise<ApiResponse<T>> {
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		const url = `${API_BASE_URL}${endpoint}`;

		console.log('🚀 Starting upload:', url);

		xhr.timeout = 30000;

		if (onProgress) {
			xhr.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					const progress = Math.round((e.loaded / e.total) * 100);
					console.log('📊 Progress:', progress + '%');
					onProgress(progress);
				}
			});
		}

		xhr.addEventListener('loadstart', () => {
			console.log('📤 Upload started');
		});

		xhr.addEventListener('load', () => {
			console.log('✅ Upload complete. Status:', xhr.status);
			console.log('Response:', xhr.responseText);

			try {
				const response: ApiResponse<T> = JSON.parse(xhr.responseText);
				resolve(response);
			} catch (error) {
				console.error('❌ Failed to parse response:', error);
				resolve({
					success: false,
					message: 'Invalid response from server'
				} as ApiResponse<T>);
			}
		});

		xhr.addEventListener('error', (e) => {
			console.error('❌ Network error:', e);
			resolve({
				success: false,
				message: 'Network error occurred'
			} as ApiResponse<T>);
		});

		xhr.addEventListener('timeout', () => {
			console.error('⏱️ Request timeout');
			resolve({
				success: false,
				message: 'Upload timeout'
			} as ApiResponse<T>);
		});

		xhr.open('POST', url);
		xhr.withCredentials = true;

		console.log('📨 Sending request...');
		xhr.send(formData);
	});
}
