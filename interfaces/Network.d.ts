import { HttpStatusCode } from 'axios';

// Common Interfaces
export interface CommonApiResponse<T> {
    data: T;
    status_code: HttpStatusCode;
    message: string;
    status: number;
    status_text: string | null | undefined;
}

export type ErrorWithMessage = {
    message: string;
    error?: string;
};

export interface RegisterUserResponse {
    token: string;
}

export interface Secret {
    id: string;
    name: string;
    secret: string;
    description: string;
}
