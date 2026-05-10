export interface StatusResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}