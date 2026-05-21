import { useEncryptionStore } from '@/store/EncryptionStore';
import { useUserStore } from '@/store/UserStore';
import { Utility } from '@/utils/Utility';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import type {
    AddSecretRequest,
    DeleteSecretRequest,
    GetListResponse,
    Secret,
    UpdateSecretRequest,
} from './types';

const secretsKey = (email: string) =>
    `secrets_${email.replace(/[^a-zA-Z0-9_]/g, '_')}`;

let _cachedKey: string | null = null;
let _cachedKeyEmail: string | null = null;
let _cachedKeyRandom: string | null = null;

export class SecretsApi {

    private static getEmail(): string {
        const email = useUserStore.getState().user?.email;
        if (!email) throw new Error('No authenticated user');
        return email;
    }

    private static async getEncryptionKey(): Promise<string> {
        const email = SecretsApi.getEmail();
        const { randomString } = useEncryptionStore.getState();
        console.log('getEncryptionKey — email:', email, '| randomString length:', randomString.length);

        if (!randomString) throw new Error('Encryption random string not loaded yet');

        if (
            _cachedKey &&
            _cachedKeyEmail === email &&
            _cachedKeyRandom === randomString
        ) {
            return _cachedKey;
        }

        const key = Utility.generateEncryptionKey(email, randomString);
        _cachedKey = key;
        _cachedKeyEmail = email;
        _cachedKeyRandom = randomString;
        return key;
    }

    private static async readRaw(): Promise<Secret[]> {
        const email = SecretsApi.getEmail();
        const json = await AsyncStorage.getItem(secretsKey(email));
        if (!json) return [];
        try {
            return JSON.parse(json) as Secret[];
        } catch {
            return [];
        }
    }

    private static async writeRaw(secrets: Secret[]): Promise<void> {
        const email = SecretsApi.getEmail();
        await AsyncStorage.setItem(secretsKey(email), JSON.stringify(secrets));
    }

    private static uid(): string {
        return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    static async getList(): Promise<{ data: { data: GetListResponse } }> {
        const [raw, encryptionKey] = await Promise.all([
            SecretsApi.readRaw(),
            SecretsApi.getEncryptionKey(),
        ]);

        const decrypted: Secret[] = await Promise.all(
            raw.map(async (s) => ({
                ...s,
                secret: await Utility.decryptSecretWithKey(s.secret, encryptionKey),
            })),
        );

        return { data: { data: { secrets: decrypted } } };
    }

    static async addSecret(payload: AddSecretRequest): Promise<void> {
        const encryptionKey = await SecretsApi.getEncryptionKey();
        const encryptedSecret = await Utility.encryptSecret(payload.secret, encryptionKey);

        const newSecret: Secret = {
            id: SecretsApi.uid(),
            name: payload.name,
            description: payload.description,
            secret: encryptedSecret,
        };

        const list = await SecretsApi.readRaw();
        list.push(newSecret);
        await SecretsApi.writeRaw(list);
    }

    static async deleteSecret(payload: DeleteSecretRequest): Promise<void> {
        const list = await SecretsApi.readRaw();
        await SecretsApi.writeRaw(list.filter((s) => s.id !== payload.id));
    }

    static async updateSecret(payload: UpdateSecretRequest): Promise<void> {
        const encryptionKey = await SecretsApi.getEncryptionKey();
        const encryptedSecret = await Utility.encryptSecret(payload.secret, encryptionKey);

        const list = await SecretsApi.readRaw();
        const idx = list.findIndex((s) => s.id === payload.id);
        if (idx === -1) throw new Error('Secret not found');

        list[idx] = {
            ...list[idx],
            ...(payload.name !== undefined && { name: payload.name }),
            ...(payload.description !== undefined && { description: payload.description }),
            secret: encryptedSecret,
        };

        await SecretsApi.writeRaw(list);
    }

    static async clearAll(): Promise<void> {
        const email = SecretsApi.getEmail();
        await AsyncStorage.removeItem(secretsKey(email));
        _cachedKey = null;
        _cachedKeyEmail = null;
        _cachedKeyRandom = null;
    }
}