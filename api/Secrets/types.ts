export interface Secret {
    id: string;
    name: string;
    secret: string;
    description: string;
    synced?: number;
}

export interface AddSecretRequest {
    name: string;
    secret: string;
    description: string;
}

export interface AddSecretResponse { secret: Secret }
export interface GetListResponse { secrets: Secret[] }

export interface DeleteSecretRequest {
    id: string;
}

export interface UpdateSecretRequest {
    id: string;
    name?: string;
    secret: string;
    description?: string;
}