// import { useEncryptionStore } from '@/store/EncryptionStore';
// import { useUserStore } from '@/store/UserStore';
// import { Utility } from '@/utils/Utility';
// import { StatusResponse } from '../types';
// import axiosInstance from '../utils/axiosFetch';
// import type {
//     AddSecretRequest, AddSecretResponse,
//     DeleteSecretRequest, GetListResponse, UpdateSecretRequest,
// } from './types';

// export class SecretsApi {
//     static async addSecret(payload: AddSecretRequest) {
//         const { email } = useUserStore.getState().user!;
//         const { randomString } = useEncryptionStore.getState();
//         const encryptionKey = Utility.generateEncryptionKey(email, randomString);
//         const encryptedSecret = await Utility.encryptSecret(payload.secret, encryptionKey);
//         return axiosInstance.post<StatusResponse<AddSecretResponse>>('secrets/addsecret', { ...payload, secret: encryptedSecret });
//     }

//     static async getList() {
//         return axiosInstance.get<StatusResponse<GetListResponse>>('secrets/getlist');
//     }

//     static async deleteSecret(payload: DeleteSecretRequest) {
//         return axiosInstance.delete<StatusResponse<void>>(`secrets/deletesecret/${payload.id}`);
//     }

//     static async updateSecret(payload: UpdateSecretRequest) {
//         const { id, ...body } = payload;
//         const { email } = useUserStore.getState().user!;
//         const { randomString } = useEncryptionStore.getState();
//         const encryptionKey = await Utility.generateEncryptionKey(email, randomString);
//         const encryptedSecret = await Utility.encryptSecret(payload.secret, encryptionKey);
//         return axiosInstance.put<StatusResponse<void>>(`secrets/updatesecret/${id}`, { ...body, secret: encryptedSecret });
//     }
// }
import { useEncryptionStore } from '@/store/EncryptionStore';
import { useUserStore } from '@/store/UserStore';
import { Utility } from '@/utils/Utility';
import { StatusResponse } from '../types';
import axiosInstance from '../utils/axiosFetch';
import type {
    AddSecretRequest, AddSecretResponse,
    DeleteSecretRequest, GetListResponse, UpdateSecretRequest,
} from './types';

export class SecretsApi {

    private static async getEncryptionKey(): Promise<string> {
        const { email } = useUserStore.getState().user!;
        const { randomString } = useEncryptionStore.getState();
        return Utility.generateEncryptionKey(email, randomString);
    }

    static async addSecret(payload: AddSecretRequest) {
        const encryptionKey = await SecretsApi.getEncryptionKey();
        const encryptedSecret = await Utility.encryptSecret(payload.secret, encryptionKey);
        return axiosInstance.post<StatusResponse<AddSecretResponse>>(
            'secrets/addsecret',
            { ...payload, secret: encryptedSecret }
        );
    }

    static async getList() {
        return axiosInstance.get<StatusResponse<GetListResponse>>('secrets/getlist');
    }

    static async deleteSecret(payload: DeleteSecretRequest) {
        return axiosInstance.delete<StatusResponse<void>>(
            `secrets/deletesecret/${payload.id}`
        );
    }

    static async updateSecret(payload: UpdateSecretRequest) {
        const { id, secret: plainSecret, ...rest } = payload;
        const encryptionKey = await SecretsApi.getEncryptionKey();
        const encryptedSecret = await Utility.encryptSecret(plainSecret, encryptionKey);
        return axiosInstance.put<StatusResponse<void>>(
            `secrets/updatesecret/${id}`,
            { ...rest, secret: encryptedSecret }
        );
    }
}