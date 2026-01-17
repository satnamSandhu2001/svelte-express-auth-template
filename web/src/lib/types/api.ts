export interface ApiResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	errors?: {
		[key: string]: string;
	};
}
