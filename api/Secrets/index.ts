import { StatusResponse } from '../types';
import axiosInstance from '../utils/axiosFetch';
import type {
    AddSecretRequest, AddSecretResponse,
    DeleteSecretRequest, GetListResponse, UpdateSecretRequest,
} from './types';

export class SecretsApi {
    static async addSecret(payload: AddSecretRequest) {
        return axiosInstance.post<StatusResponse<AddSecretResponse>>('secrets/addsecret', payload);
    }

    static async getList() {
        return axiosInstance.get<StatusResponse<GetListResponse>>('secrets/getlist');
    }

    static async deleteSecret(payload: DeleteSecretRequest) {
        return axiosInstance.delete<StatusResponse<void>>(`secrets/deletesecret/${payload.id}`);
    }

    static async updateSecret(payload: UpdateSecretRequest) {
        const { id, ...body } = payload;
        return axiosInstance.put<StatusResponse<void>>(`secrets/updatesecret/${id}`, body);
    }
}