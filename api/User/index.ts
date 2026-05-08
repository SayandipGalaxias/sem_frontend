import { StatusResponse } from '../types';
import axiosInstance from '../utils/axiosFetch';
import type { RegisterRequest, RegisterResponse } from './types';

export class UserApi {
    static async register(payload: RegisterRequest) {
        return axiosInstance.post<StatusResponse<RegisterResponse>>('users/register', payload);
    }
}