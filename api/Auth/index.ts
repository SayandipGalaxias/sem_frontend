import { StatusResponse } from '../types';
import axiosInstance from '../utils/axiosFetch';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './types';

export class AuthApi {
    static async login(payload: LoginRequest) {
        return axiosInstance.post<StatusResponse<LoginResponse>>('users/login', payload);
    }

    static async register(payload: RegisterRequest) {
        return axiosInstance.post<StatusResponse<RegisterResponse>>('users/register', payload);
    }
}