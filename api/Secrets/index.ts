// import { useEncryptionStore } from '@/store/EncryptionStore';
// import { useUserStore } from '@/store/UserStore';
// import { Utility } from '@/utils/Utility';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import 'react-native-get-random-values';
// import type {
//     AddSecretRequest,
//     DeleteSecretRequest,
//     GetListResponse,
//     Secret,
//     UpdateSecretRequest,
// } from './types';

// const secretsKey = (email: string) =>
//     `secrets_${email.replace(/[^a-zA-Z0-9_]/g, '_')}`;

// let _cachedKey: string | null = null;
// let _cachedKeyEmail: string | null = null;
// let _cachedKeyRandom: string | null = null;

// export class SecretsApi {

//     private static getEmail(): string {
//         const email = useUserStore.getState().user?.email;
//         if (!email) throw new Error('No authenticated user');
//         return email;
//     }

//     private static async getEncryptionKey(): Promise<string> {
//         const email = SecretsApi.getEmail();
//         const { randomString } = useEncryptionStore.getState();
//         // console.log('getEncryptionKey — email:', email, '| randomString length:', randomString.length);

//         if (!randomString) throw new Error('Encryption random string not loaded yet');

//         if (
//             _cachedKey &&
//             _cachedKeyEmail === email &&
//             _cachedKeyRandom === randomString
//         ) {
//             return _cachedKey;
//         }

//         const key = Utility.generateEncryptionKey(email, randomString);
//         _cachedKey = key;
//         _cachedKeyEmail = email;
//         _cachedKeyRandom = randomString;
//         return key;
//     }

//     private static async readRaw(): Promise<Secret[]> {
//         const email = SecretsApi.getEmail();
//         const json = await AsyncStorage.getItem(secretsKey(email));
//         if (!json) return [];
//         try {
//             return JSON.parse(json) as Secret[];
//         } catch {
//             return [];
//         }
//     }

//     private static async writeRaw(secrets: Secret[]): Promise<void> {
//         const email = SecretsApi.getEmail();
//         await AsyncStorage.setItem(secretsKey(email), JSON.stringify(secrets));
//     }

//     private static uid(): string {
//         return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
//     }

//     static async getList(): Promise<{ data: { data: GetListResponse } }> {
//         const [raw, encryptionKey] = await Promise.all([
//             SecretsApi.readRaw(),
//             SecretsApi.getEncryptionKey(),
//         ]);

//         const decrypted: Secret[] = await Promise.all(
//             raw.map(async (s) => ({
//                 ...s,
//                 secret: await Utility.decryptSecretWithKey(s.secret, encryptionKey),
//             })),
//         );

//         return { data: { data: { secrets: decrypted } } };
//     }

//     static async addSecret(payload: AddSecretRequest): Promise<void> {
//         const encryptionKey = await SecretsApi.getEncryptionKey();
//         const encryptedSecret = await Utility.encryptSecret(payload.secret, encryptionKey);

//         const newSecret: Secret = {
//             id: SecretsApi.uid(),
//             name: payload.name,
//             description: payload.description,
//             secret: encryptedSecret,
//         };

//         const list = await SecretsApi.readRaw();
//         list.push(newSecret);
//         await SecretsApi.writeRaw(list);
//     }

//     static async deleteSecret(payload: DeleteSecretRequest): Promise<void> {
//         const list = await SecretsApi.readRaw();
//         await SecretsApi.writeRaw(list.filter((s) => s.id !== payload.id));
//     }

//     static async updateSecret(payload: UpdateSecretRequest): Promise<void> {
//         const encryptionKey = await SecretsApi.getEncryptionKey();
//         const encryptedSecret = await Utility.encryptSecret(payload.secret, encryptionKey);

//         const list = await SecretsApi.readRaw();
//         const idx = list.findIndex((s) => s.id === payload.id);
//         if (idx === -1) throw new Error('Secret not found');

//         list[idx] = {
//             ...list[idx],
//             ...(payload.name !== undefined && { name: payload.name }),
//             ...(payload.description !== undefined && { description: payload.description }),
//             secret: encryptedSecret,
//         };

//         await SecretsApi.writeRaw(list);
//     }

//     static async clearAll(): Promise<void> {
//         const email = SecretsApi.getEmail();
//         await AsyncStorage.removeItem(secretsKey(email));
//         _cachedKey = null;
//         _cachedKeyEmail = null;
//         _cachedKeyRandom = null;
//     }
// }

import { useEncryptionStore } from '@/store/EncryptionStore';
import { useUserStore } from '@/store/UserStore';
import { Utility } from '@/utils/Utility';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import type {
    AddSecretRequest,
    DeleteSecretRequest,
    GetListResponse,
    Secret,
    UpdateSecretRequest,
} from './types';


const IS_NATIVE = Platform.OS !== 'web';


const webKey = (email: string) =>
    `secrets_${email.replace(/[^a-zA-Z0-9_]/g, '_')}`;

async function webReadRaw(email: string): Promise<Secret[]> {
    const json = await AsyncStorage.getItem(webKey(email));
    if (!json) return [];
    try { return JSON.parse(json) as Secret[]; } catch { return []; }
}

async function webWriteRaw(email: string, secrets: Secret[]): Promise<void> {
    await AsyncStorage.setItem(webKey(email), JSON.stringify(secrets));
}


type SQLiteDB = import('expo-sqlite').SQLiteDatabase;
let _db: SQLiteDB | null = null;

async function getDb(): Promise<SQLiteDB> {
    if (_db) return _db;
    const SQLite = await import('expo-sqlite');
    _db = await SQLite.openDatabaseAsync('ismart.db');
    await _db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS secrets (
            id          TEXT    PRIMARY KEY NOT NULL,
            email       TEXT    NOT NULL,
            name        TEXT    NOT NULL,
            description TEXT    NOT NULL DEFAULT '',
            secret      TEXT    NOT NULL,
            synced      INTEGER NOT NULL DEFAULT 0,
            updated_at  INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_secrets_email ON secrets (email);
    `);
    return _db;
}


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

    private static uid(): string {
        return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }


    static async getList(): Promise<{ data: { data: GetListResponse } }> {
        const email = SecretsApi.getEmail();
        const encryptionKey = await SecretsApi.getEncryptionKey();

        let rows: Secret[];

        if (IS_NATIVE) {
            const db = await getDb();
            rows = await db.getAllAsync<Secret>(
                `SELECT id, name, description, secret FROM secrets WHERE email = ? ORDER BY updated_at ASC`,
                [email],
            );
        } else {
            rows = await webReadRaw(email);
        }

        const decrypted: Secret[] = await Promise.all(
            rows.map(async (row) => ({
                ...row,
                secret: await Utility.decryptSecretWithKey(row.secret, encryptionKey),
            })),
        );

        return { data: { data: { secrets: decrypted } } };
    }

    static async addSecret(payload: AddSecretRequest): Promise<void> {
        const email = SecretsApi.getEmail();
        const encryptionKey = await SecretsApi.getEncryptionKey();
        const encryptedSecret = await Utility.encryptSecret(payload.secret, encryptionKey);

        if (IS_NATIVE) {
            const db = await getDb();
            await db.runAsync(
                `INSERT INTO secrets (id, email, name, description, secret, synced, updated_at)
                 VALUES (?, ?, ?, ?, ?, 0, ?)`,
                [
                    SecretsApi.uid(),
                    email,
                    payload.name ?? '',
                    payload.description ?? '',
                    encryptedSecret ?? '',
                    Date.now(),
                ],
            );
        } else {
            const list = await webReadRaw(email);
            list.push({
                id: SecretsApi.uid(),
                name: payload.name ?? '',
                description: payload.description ?? '',
                secret: encryptedSecret,
            });
            await webWriteRaw(email, list);
        }
    }


    static async deleteSecret(payload: DeleteSecretRequest): Promise<void> {
        const email = SecretsApi.getEmail();

        if (IS_NATIVE) {
            const db = await getDb();
            await db.runAsync(`DELETE FROM secrets WHERE id = ?`, [payload.id]);
        } else {
            const list = await webReadRaw(email);
            await webWriteRaw(email, list.filter((s) => s.id !== payload.id));
        }
    }


    static async updateSecret(payload: UpdateSecretRequest): Promise<void> {
        const email = SecretsApi.getEmail();
        const encryptionKey = await SecretsApi.getEncryptionKey();
        const encryptedSecret = await Utility.encryptSecret(payload.secret, encryptionKey);

        if (IS_NATIVE) {
            const db = await getDb();
            const fields: string[] = ['secret = ?', 'synced = 0', 'updated_at = ?'];
            const values: (string | number)[] = [encryptedSecret ?? '', Date.now()];

            if (payload.name !== undefined) { fields.push('name = ?'); values.push(payload.name ?? ''); }
            if (payload.description !== undefined) { fields.push('description = ?'); values.push(payload.description ?? ''); }

            values.push(payload.id ?? '');
            await db.runAsync(`UPDATE secrets SET ${fields.join(', ')} WHERE id = ?`, values);
        } else {
            const list = await webReadRaw(email);
            const idx = list.findIndex((s) => s.id === payload.id);
            if (idx === -1) throw new Error('Secret not found');
            list[idx] = {
                ...list[idx],
                ...(payload.name !== undefined && { name: payload.name }),
                ...(payload.description !== undefined && { description: payload.description }),
                secret: encryptedSecret,
            };
            await webWriteRaw(email, list);
        }
    }


    // static async getUnsynced(): Promise<Secret[]> {
    //     const email = SecretsApi.getEmail();
    //     if (IS_NATIVE) {
    //         const db = await getDb();
    //         return db.getAllAsync<Secret>(
    //             `SELECT id, name, description, secret FROM secrets WHERE email = ? AND synced = 0`,
    //             [email],
    //         );
    //     }
    //     return webReadRaw(email);
    // }

    static async getUnsynced(): Promise<Secret[]> {
        const email = SecretsApi.getEmail();
        if (IS_NATIVE) {
            const db = await getDb();
            const rows = await db.getAllAsync<Secret>(
                `SELECT id, name, description, secret FROM secrets WHERE email = ? AND synced = 0`,
                [email],
            );
            return rows.map(r => ({
                id: r.id ?? '',
                name: r.name ?? '',
                description: r.description ?? '',
                secret: r.secret ?? '',
            })).filter(r => r.id && r.secret);
        }
        return webReadRaw(email);
    }

    static async getAllRaw(): Promise<Secret[]> {
        const email = SecretsApi.getEmail();
        if (IS_NATIVE) {
            const db = await getDb();
            return db.getAllAsync<Secret>(
                `SELECT id, name, description, secret FROM secrets WHERE email = ?`,
                [email],
            );
        }
        return webReadRaw(email);
    }


    static async markSynced(ids: string[]): Promise<void> {
        if (!ids.length || !IS_NATIVE) return;
        const db = await getDb();
        for (const id of ids) {
            if (!id) continue;
            await db.runAsync(`UPDATE secrets SET synced = 1 WHERE id = ?`, [id]);
        }
    }


    static async bulkUpsert(secrets: Secret[]): Promise<void> {
        if (!secrets.length) return;
        const email = SecretsApi.getEmail();

        if (IS_NATIVE) {
            const db = await getDb();
            const now = Date.now();
            await db.withExclusiveTransactionAsync(async (txn) => {
                for (const s of secrets) {
                    await txn.runAsync(
                        `INSERT OR REPLACE INTO secrets
                            (id, email, name, description, secret, synced, updated_at)
                         VALUES (?, ?, ?, ?, ?, 1, ?)`,
                        [s.id ?? '', email, s.name ?? '', s.description ?? '', s.secret ?? '', now],
                    );
                }
            });
        } else {
            await webWriteRaw(email, secrets);
        }
    }


    static async clearAll(): Promise<void> {
        const email = SecretsApi.getEmail();
        if (IS_NATIVE) {
            const db = await getDb();
            await db.runAsync(`DELETE FROM secrets WHERE email = ?`, [email]);
        } else {
            await AsyncStorage.removeItem(webKey(email));
        }
        _cachedKey = null;
        _cachedKeyEmail = null;
        _cachedKeyRandom = null;
    }
}