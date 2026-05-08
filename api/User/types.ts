export interface User {
    email: string;
    type: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
}
export interface RegisterResponse { user: User }