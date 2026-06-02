// import { useContactsStore } from '@/store/ContactsStore';
// import { useEncryptionStore } from '@/store/EncryptionStore';
// import { useUserStore } from '@/store/UserStore';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as aesjs from 'aes-js';
// import * as Crypto from 'expo-crypto';
// import * as WebBrowser from 'expo-web-browser';
// import { Platform } from 'react-native';
// import { SecretsApi } from '../api/Secrets';
// import type { Secret } from '../api/Secrets/types';
// import type { AppContact } from '../interfaces/Contacts';

// const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
// const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;
// const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
// const IOS_REDIRECT_URI = process.env.EXPO_PUBLIC_IOS_REDIRECT_URI;
// const ANDROID_REDIRECT_URI = process.env.EXPO_PUBLIC_ANDROID_REDIRECT_URI;
// const WEB_CLIENT_SECRET = process.env.EXPO_PUBLIC_WEB_CLIENT_SECRET;

// WebBrowser.maybeCompleteAuthSession();

// const SCOPES = [
//     'https://www.googleapis.com/auth/drive.appdata',
//     'https://www.googleapis.com/auth/userinfo.profile',
//     'https://www.googleapis.com/auth/userinfo.email',
// ];

// const BACKUP_FILE_NAME = 'ismart_backup.json';
// const MANIFEST_FILE_NAME = 'ismart_manifest.json';
// const BACKUP_SALT = 'ismart-backup-salt-v1';
// const ASYNC_KEY_DRIVE_USER = '@ismart/drive_user';
// const ASYNC_KEY_ACCESS_TOKEN = '@ismart/drive_access_token';


// export interface DriveUser {
//     email: string;
//     name?: string;
// }

// export interface BackupPayload {
//     version: number;
//     ts: number;
//     secrets: Secret[];
//     contacts: AppContact[];
//     randomString: string;
// }

// export interface BackupInfo {
//     version: number;
//     ts: number;
//     secretCount: number;
//     contactCount: number;
//     fileSize: number;
// }

// export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';


// let _accessToken: string | null = null;
// let _driveUser: DriveUser | null = null;


// function getSubtle(): SubtleCrypto | null {
//     return globalThis?.crypto?.subtle ?? (typeof window !== 'undefined' ? window?.crypto?.subtle : null) ?? null;
// }

// function isWeb(): boolean {
//     try {
//         return (
//             typeof window !== 'undefined' &&
//             typeof window.location?.protocol === 'string' &&
//             window.location.protocol.startsWith('http') &&
//             getSubtle() !== null
//         );
//     } catch {
//         return false;
//     }
// }

// async function sha256Native(data: Uint8Array): Promise<Uint8Array> {
//     const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
//     const hashHex = await Crypto.digestStringAsync(
//         Crypto.CryptoDigestAlgorithm.SHA256,
//         hex,
//         { encoding: Crypto.CryptoEncoding.HEX },
//     );
//     return new Uint8Array((hashHex.match(/.{1,2}/g) as string[]).map(b => parseInt(b, 16)));
// }

// async function deriveBackupKeyNative(email: string): Promise<Uint8Array> {
//     let key = new TextEncoder().encode(email + BACKUP_SALT);
//     for (let i = 0; i < 1000; i++) key = await sha256Native(key);
//     return key;
// }

// async function encryptPayloadNative(plaintext: string, email: string): Promise<string> {
//     const key = await deriveBackupKeyNative(email);
//     const iv = await Crypto.getRandomBytesAsync(16);
//     const keyArr = Array.from(key);
//     const ivArr = Array.from(iv);

//     const textBytes = aesjs.utils.utf8.toBytes(plaintext);
//     const pad = 16 - (textBytes.length % 16);
//     const padded = new Uint8Array(textBytes.length + pad);
//     padded.set(textBytes);
//     padded.fill(pad, textBytes.length);

//     const aesCbc = new aesjs.ModeOfOperation.cbc(keyArr, ivArr);
//     const encrypted = aesCbc.encrypt(Array.from(padded));

//     return JSON.stringify({
//         cipher: aesjs.utils.hex.fromBytes(encrypted),
//         iv: aesjs.utils.hex.fromBytes(ivArr),
//         web: false,
//     });
// }

// async function decryptPayloadNative(encryptedJson: string, email: string): Promise<string> {
//     const trimmed = encryptedJson.trim();
//     if (!trimmed.startsWith('{')) throw new Error(`Expected JSON but got: "${trimmed.slice(0, 80)}"`);

//     const key = await deriveBackupKeyNative(email);
//     const keyArr = Array.from(key);
//     const parsed: { cipher: string; iv: string } = JSON.parse(trimmed);
//     const ivArr = Array.from(aesjs.utils.hex.toBytes(parsed.iv));
//     const cipherArr = Array.from(aesjs.utils.hex.toBytes(parsed.cipher));

//     const aesCbc = new aesjs.ModeOfOperation.cbc(keyArr, ivArr);
//     const decrypted = aesCbc.decrypt(cipherArr);
//     const padLen = decrypted[decrypted.length - 1];

//     return aesjs.utils.utf8.fromBytes(decrypted.slice(0, decrypted.length - padLen));
// }

// async function encryptPayload(plaintext: string, email: string): Promise<string> {
//     return encryptPayloadNative(plaintext, email);
// }

// async function decryptPayload(encryptedJson: string, email: string): Promise<string> {
//     return decryptPayloadNative(encryptedJson, email);
// }


// function authHeader() {
//     if (!_accessToken) throw new Error('Not signed in to Google Drive.');
//     return { Authorization: `Bearer ${_accessToken}` };
// }

// async function driveList(nameContains?: string): Promise<Array<{ id: string; name: string; size?: string }>> {
//     let q = `'appDataFolder' in parents`;
//     if (nameContains) q += ` and name = '${nameContains}'`;
//     const url =
//         `https://www.googleapis.com/drive/v3/files` +
//         `?spaces=appDataFolder&fields=files(id,name,size)` +
//         `&q=${encodeURIComponent(q)}`;
//     const res = await fetch(url, { headers: authHeader() });
//     if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
//     const json = await res.json();
//     return json.files ?? [];
// }

// async function driveDownload(fileId: string): Promise<string> {
//     const res = await fetch(
//         `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
//         { headers: authHeader() },
//     );
//     if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(`Drive download failed: ${res.status} — ${errText.slice(0, 100)}`);
//     }
//     return res.text();
// }

// async function driveUpload(name: string, content: string): Promise<string> {
//     // const boundary = 'ismart_boundary_xyz';
//     const boundary = `----IsmartBoundary${Date.now()}`;
//     const metadata = JSON.stringify({ name, parents: ['appDataFolder'] });
//     const body =
//         `--${boundary}\r\n` +
//         `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
//         `${metadata}\r\n` +
//         `--${boundary}\r\n` +
//         `Content-Type: application/json\r\n\r\n` +
//         `${content}\r\n` +
//         `--${boundary}--`;

//     const res = await fetch(
//         'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
//         {
//             method: 'POST',
//             headers: {
//                 ...authHeader(),
//                 'Content-Type': `multipart/related; boundary=${boundary}`,
//             },
//             body,
//         },
//     );
//     if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
//     const json = await res.json();
//     return json.id as string;
// }

// async function driveUpdate(fileId: string, content: string): Promise<void> {
//     const res = await fetch(
//         `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
//         {
//             method: 'PATCH',
//             headers: { ...authHeader(), 'Content-Type': 'application/json' },
//             body: content,
//         },
//     );
//     if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
// }

// async function driveDelete(fileId: string): Promise<void> {
//     await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
//         method: 'DELETE',
//         headers: authHeader(),
//     });
// }

// async function driveUpsert(name: string, content: string): Promise<string> {
//     const existing = await driveList(name);
//     if (existing.length > 0) {
//         await driveUpdate(existing[0].id, content);
//         return existing[0].id;
//     }
//     return driveUpload(name, content);
// }


// export async function signInWithGoogle(): Promise<DriveUser> {
//     if (isWeb()) {
//         const state = Math.random().toString(36).substring(2);
//         const redirectUri = window.location.origin + '/oauth-callback';
//         sessionStorage.setItem('oauth_state', state);
//         sessionStorage.setItem('oauth_redirect_uri', redirectUri);

//         const authUrl =
//             `https://accounts.google.com/o/oauth2/v2/auth` +
//             `?client_id=${encodeURIComponent(WEB_CLIENT_ID!)}` +
//             `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//             `&response_type=code` +
//             `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
//             `&state=${state}` +
//             `&access_type=online`;

//         window.location.href = authUrl;
//         return new Promise(() => { });
//     }

//     const isIos = Platform.OS === 'ios';
//     const clientId = isIos ? IOS_CLIENT_ID : WEB_CLIENT_ID;
//     const redirectUri = isIos ? IOS_REDIRECT_URI : ANDROID_REDIRECT_URI;
//     const state = Math.random().toString(36).substring(2);

//     const authUrl =
//         `https://accounts.google.com/o/oauth2/v2/auth` +
//         `?client_id=${encodeURIComponent(clientId!)}` +
//         `&redirect_uri=${encodeURIComponent(redirectUri!)}` +
//         `&response_type=code` +
//         `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
//         `&state=${state}` +
//         `&access_type=online`;

//     const result = await WebBrowser.openAuthSessionAsync(authUrl, 'ismart-manager://');
//     if (result.type !== 'success') {
//         throw new Error(
//             result.type === 'cancel' ? 'Sign-in cancelled' : `Sign-in failed: ${result.type}`,
//         );
//     }

//     const queryString = result.url.includes('?') ? result.url.split('?')[1] : '';
//     const params = Object.fromEntries(
//         queryString.split('&').map(p => p.split('=').map(decodeURIComponent)),
//     );
//     if (!params.code) throw new Error('No authorization code returned');

//     const tokenBody = [
//         `code=${encodeURIComponent(params.code)}`,
//         `client_id=${encodeURIComponent(clientId!)}`,
//         `redirect_uri=${encodeURIComponent(redirectUri!)}`,
//         `grant_type=authorization_code`,
//     ];
//     if (!isIos) tokenBody.push(`client_secret=${encodeURIComponent(WEB_CLIENT_SECRET!)}`);

//     const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//         body: tokenBody.join('&'),
//     });
//     const tokenJson = await tokenRes.json();
//     if (!tokenJson.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(tokenJson)}`);

//     _accessToken = tokenJson.access_token;

//     const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
//         headers: { Authorization: `Bearer ${_accessToken}` },
//     });
//     const profile = await profileRes.json();
//     _driveUser = { email: profile.email ?? 'unknown', name: profile.name ?? profile.given_name };

//     await AsyncStorage.setItem(ASYNC_KEY_ACCESS_TOKEN, _accessToken!);
//     await AsyncStorage.setItem(ASYNC_KEY_DRIVE_USER, JSON.stringify(_driveUser));

//     return _driveUser;
// }

// export async function restoreDriveSession(): Promise<DriveUser | null> {
//     try {
//         const [token, userJson] = await Promise.all([
//             AsyncStorage.getItem(ASYNC_KEY_ACCESS_TOKEN),
//             AsyncStorage.getItem(ASYNC_KEY_DRIVE_USER),
//         ]);
//         if (token && userJson) {
//             _accessToken = token;
//             _driveUser = JSON.parse(userJson);
//             return _driveUser;
//         }
//     } catch (_) { }
//     return null;
// }

// export async function signOutFromDrive(): Promise<void> {
//     _accessToken = null;
//     _driveUser = null;
//     await AsyncStorage.removeItem(ASYNC_KEY_ACCESS_TOKEN);
//     await AsyncStorage.removeItem(ASYNC_KEY_DRIVE_USER);
// }

// export function getDriveUser(): DriveUser | null { return _driveUser; }
// export function isDriveAuthenticated(): boolean { return Boolean(_accessToken); }

// export async function backupToDrive(
//     onProgress?: (msg: string) => void,
// ): Promise<BackupInfo> {
//     if (!isDriveAuthenticated()) throw new Error('Not signed in to Google Drive.');

//     const email = useUserStore.getState().user?.email;
//     if (!email) throw new Error('No authenticated user.');

//     const randomString = useEncryptionStore.getState().randomString;
//     if (!randomString) throw new Error('Encryption key not loaded.');

//     onProgress?.('Fetching existing backup…');
//     let existingSecrets: Secret[] = [];
//     let existingContacts: AppContact[] = [];
//     let version = 1;

//     try {
//         const backupFiles = await driveList(BACKUP_FILE_NAME);
//         if (backupFiles.length > 0) {
//             const raw = await driveDownload(backupFiles[0].id);
//             const plaintext = await decryptPayload(raw, email);
//             const payload = JSON.parse(plaintext) as BackupPayload;
//             existingSecrets = payload.secrets ?? [];
//             existingContacts = payload.contacts ?? [];
//             version = (payload.version ?? 0) + 1;
//         }
//     } catch (_) {
//         // No existing backup - start fresh
//     }

//     onProgress?.('Reading new / changed secrets…');
//     const unsyncedSecrets = await SecretsApi.getUnsynced();

//     // onProgress?.('Merging secrets…');
//     // const secretMap = new Map<string, Secret>(existingSecrets.map(s => [s.id, s]));
//     // for (const s of unsyncedSecrets) secretMap.set(s.id, s);
//     // const mergedSecrets = Array.from(secretMap.values());

//     onProgress?.('Merging secrets…');
//     const secretMap = new Map<string, Secret>(
//         existingSecrets
//             .filter(s => s.id && s.secret)
//             .map(s => [s.id, s])
//     );
//     for (const s of unsyncedSecrets) {
//         if (s.id && s.secret) secretMap.set(s.id, s);
//     }
//     const mergedSecrets = Array.from(secretMap.values());

//     onProgress?.('Reading contacts…');
//     const contactsJson = await AsyncStorage.getItem(`@contacts_${email}`);
//     const contacts: AppContact[] = contactsJson ? JSON.parse(contactsJson) : existingContacts;

//     onProgress?.('Encrypting backup…');
//     const payload: BackupPayload = {
//         version,
//         ts: Date.now(),
//         secrets: mergedSecrets,
//         contacts,
//         randomString,
//     };
//     const encryptedContent = await encryptPayload(JSON.stringify(payload), email);

//     onProgress?.('Uploading to Google Drive…');
//     await driveUpsert(BACKUP_FILE_NAME, encryptedContent);

//     const manifest: BackupInfo = {
//         version,
//         ts: Date.now(),
//         secretCount: mergedSecrets.length,
//         contactCount: contacts.length,
//         fileSize: encryptedContent.length,
//     };
//     await driveUpsert(MANIFEST_FILE_NAME, JSON.stringify(manifest));

//     onProgress?.('Marking secrets as synced…');
//     await SecretsApi.markSynced(unsyncedSecrets.map(s => s.id));

//     onProgress?.('Backup complete ✓');
//     return manifest;
// }

// export async function restoreFromDrive(
//     onProgress?: (msg: string) => void,
// ): Promise<void> {
//     console.log('RESTORE START');
//     if (!isDriveAuthenticated()) throw new Error('Not signed in to Google Drive.');

//     const email = useUserStore.getState().user?.email;
//     if (!email) throw new Error('No authenticated user.');

//     onProgress?.('Finding backup…');
//     const files = await driveList(BACKUP_FILE_NAME);
//     if (!files.length) throw new Error('No backup found on Google Drive.');

//     onProgress?.('Downloading backup…');
//     const raw = await driveDownload(files[0].id);

//     onProgress?.('Decrypting backup…');
//     let plaintext: string;
//     try {
//         console.log('RAW LENGTH:', raw.length);
//         console.log('RAW STARTS WITH:', raw.slice(0, 50));
//         console.log('RAW ENDS WITH:', raw.slice(-50));
//         console.log('CHAR AT 458-462:', [...raw.slice(458, 462)].map(c => c.charCodeAt(0)));
//         plaintext = await decryptPayload(raw, email);
//     } catch (e) {
//         throw new Error(`Decrypt failed: ${e}`);
//     }

//     console.log('PLAINTEXT LENGTH:', plaintext.length);
//     console.log('PLAINTEXT STARTS WITH:', plaintext.slice(0, 80));
//     console.log('PLAINTEXT AROUND 460:', plaintext.slice(450, 470));

//     const payload = JSON.parse(plaintext) as BackupPayload;

//     console.log('RESTORE PAYLOAD');
//     console.log('secrets:', payload.secrets?.length);
//     console.log('contacts:', payload.contacts?.length);
//     console.log('randomString:', !!payload.randomString);

//     onProgress?.('Restoring encryption key…');
//     await useEncryptionStore.getState().saveRandomString(email, payload.randomString);

//     onProgress?.('Restoring secrets…');
//     if (payload.secrets?.length) {
//         await SecretsApi.bulkUpsert(payload.secrets);
//     }
//     console.log('Restored secrets into SQLite:', payload.secrets?.length ?? 0);

//     onProgress?.('Restoring contacts…');
//     if (payload.contacts?.length) {
//         await AsyncStorage.setItem(`@contacts_${email}`, JSON.stringify(payload.contacts));
//         useContactsStore.getState().setContacts(payload.contacts);
//     }

//     onProgress?.('Restore complete ✓');
//     console.log('RESTORE COMPLETE');
// }


// export async function getBackupInfo(): Promise<BackupInfo | null> {
//     if (!isDriveAuthenticated()) return null;
//     try {
//         const files = await driveList(MANIFEST_FILE_NAME);
//         if (!files.length) return null;
//         const raw = await driveDownload(files[0].id);
//         return JSON.parse(raw) as BackupInfo;
//     } catch (_) {
//         return null;
//     }
// }

// export async function deleteAllBackupFiles(): Promise<void> {
//     const files = await driveList(BACKUP_FILE_NAME);
//     const manifests = await driveList(MANIFEST_FILE_NAME);
//     await Promise.all([
//         ...files.map(f => driveDelete(f.id)),
//         ...manifests.map(f => driveDelete(f.id)),
//     ]);
// }

import { useContactsStore } from '@/store/ContactsStore';
import { useEncryptionStore } from '@/store/EncryptionStore';
import { useUserStore } from '@/store/UserStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { SecretsApi } from '../api/Secrets';
import type { Secret } from '../api/Secrets/types';
import type { AppContact } from '../interfaces/Contacts';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const IOS_REDIRECT_URI = process.env.EXPO_PUBLIC_IOS_REDIRECT_URI;
const ANDROID_REDIRECT_URI = process.env.EXPO_PUBLIC_ANDROID_REDIRECT_URI;
const WEB_CLIENT_SECRET = process.env.EXPO_PUBLIC_WEB_CLIENT_SECRET;

WebBrowser.maybeCompleteAuthSession();

const SCOPES = [
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
];

const BACKUP_FILE_NAME = 'ismart_backup.json';
const MANIFEST_FILE_NAME = 'ismart_manifest.json';
const BACKUP_SALT = 'ismart-backup-salt-v1';
const ASYNC_KEY_DRIVE_USER = '@ismart/drive_user';
const ASYNC_KEY_ACCESS_TOKEN = '@ismart/drive_access_token';


export interface DriveUser {
    email: string;
    name?: string;
}

export interface BackupPayload {
    version: number;
    ts: number;
    secrets: Secret[];
    contacts: AppContact[];
    randomString: string;
}

export interface BackupInfo {
    version: number;
    ts: number;
    secretCount: number;
    contactCount: number;
    fileSize: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';


export class DriveAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DriveAuthError';
    }
}


let _accessToken: string | null = null;
let _driveUser: DriveUser | null = null;


function getSubtle(): SubtleCrypto | null {
    return globalThis?.crypto?.subtle ?? (typeof window !== 'undefined' ? window?.crypto?.subtle : null) ?? null;
}

function isWeb(): boolean {
    try {
        return (
            typeof window !== 'undefined' &&
            typeof window.location?.protocol === 'string' &&
            window.location.protocol.startsWith('http') &&
            getSubtle() !== null
        );
    } catch {
        return false;
    }
}

async function sha256Native(data: Uint8Array): Promise<Uint8Array> {
    const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        hex,
        { encoding: Crypto.CryptoEncoding.HEX },
    );
    return new Uint8Array((hashHex.match(/.{1,2}/g) as string[]).map(b => parseInt(b, 16)));
}

async function deriveBackupKeyNative(email: string): Promise<Uint8Array> {
    let key = new TextEncoder().encode(email + BACKUP_SALT);
    for (let i = 0; i < 1000; i++) key = await sha256Native(key);
    return key;
}

async function encryptPayloadNative(plaintext: string, email: string): Promise<string> {
    const key = await deriveBackupKeyNative(email);
    const iv = await Crypto.getRandomBytesAsync(16);
    const keyArr = Array.from(key);
    const ivArr = Array.from(iv);

    const textBytes = aesjs.utils.utf8.toBytes(plaintext);
    const pad = 16 - (textBytes.length % 16);
    const padded = new Uint8Array(textBytes.length + pad);
    padded.set(textBytes);
    padded.fill(pad, textBytes.length);

    const aesCbc = new aesjs.ModeOfOperation.cbc(keyArr, ivArr);
    const encrypted = aesCbc.encrypt(Array.from(padded));

    return JSON.stringify({
        cipher: aesjs.utils.hex.fromBytes(encrypted),
        iv: aesjs.utils.hex.fromBytes(ivArr),
        web: false,
    });
}

async function decryptPayloadNative(encryptedJson: string, email: string): Promise<string> {
    const trimmed = encryptedJson.trim().replace(/^\uFEFF/, '');

    if (!trimmed) {
        throw new Error('Empty response from Drive — file may be missing or empty.');
    }

    if (!trimmed.startsWith('{')) {
        // Likely an HTML error page or plain-text error from Drive API
        const preview = trimmed.slice(0, 200);
        if (trimmed.toLowerCase().includes('<html')) {
            throw new DriveAuthError(
                'Google Drive returned an HTML error page. Your session may have expired. Please sign out and sign in again.',
            );
        }
        throw new Error(`Expected encrypted JSON but got unexpected content: "${preview}"`);
    }

    let parsed: { cipher: string; iv: string };
    try {
        parsed = JSON.parse(trimmed);
    } catch (e) {
        throw new Error(`Backup file is corrupted (invalid JSON envelope): ${(e as Error).message}`);
    }

    if (!parsed.cipher || !parsed.iv) {
        throw new Error('Backup file is missing cipher or iv fields — file may be corrupted.');
    }

    const key = await deriveBackupKeyNative(email);
    const keyArr = Array.from(key);

    let ivArr: number[];
    let cipherArr: number[];
    try {
        ivArr = Array.from(aesjs.utils.hex.toBytes(parsed.iv));
        cipherArr = Array.from(aesjs.utils.hex.toBytes(parsed.cipher));
    } catch (e) {
        throw new Error(`Backup file contains invalid hex data: ${(e as Error).message}`);
    }

    const aesCbc = new aesjs.ModeOfOperation.cbc(keyArr, ivArr);
    const decrypted = aesCbc.decrypt(cipherArr);
    const padLen = decrypted[decrypted.length - 1];

    if (padLen < 1 || padLen > 16) {
        throw new Error(
            'Decryption produced invalid padding — the backup may have been encrypted with a different key or email.',
        );
    }

    const unpadded = decrypted.slice(0, decrypted.length - padLen);
    const plaintext = aesjs.utils.utf8.fromBytes(unpadded);

    if (!plaintext.trim().startsWith('{')) {
        throw new Error(
            'Decrypted content is not valid JSON — the backup key or email may not match.',
        );
    }

    return plaintext;
}

async function encryptPayload(plaintext: string, email: string): Promise<string> {
    return encryptPayloadNative(plaintext, email);
}

async function decryptPayload(encryptedJson: string, email: string): Promise<string> {
    return decryptPayloadNative(encryptedJson, email);
}


function authHeader(): Record<string, string> {
    if (!_accessToken) throw new DriveAuthError('Not signed in to Google Drive. Please sign in again.');
    return { Authorization: `Bearer ${_accessToken}` };
}


async function checkDriveResponse(res: Response, context: string): Promise<void> {
    if (res.ok) return;

    let body = '';
    try { body = await res.text(); } catch (_) { /* ignore */ }

    if (res.status === 401) {
        _accessToken = null;
        await AsyncStorage.removeItem(ASYNC_KEY_ACCESS_TOKEN);
        throw new DriveAuthError(
            `Your Google session expired (401). Please disconnect and sign in again.\n\nDetails: ${body.slice(0, 200)}`,
        );
    }

    if (res.status === 403) {
        throw new DriveAuthError(
            `Access denied by Google Drive (403). You may need to re-authorise the app.\n\nDetails: ${body.slice(0, 200)}`,
        );
    }

    if (res.status === 429) {
        throw new Error(`Google Drive rate limit hit (429). Please wait a moment and try again.`);
    }

    throw new Error(`${context} failed with status ${res.status}: ${body.slice(0, 200)}`);
}

async function driveList(nameContains?: string): Promise<Array<{ id: string; name: string; size?: string }>> {
    let q = `'appDataFolder' in parents`;
    if (nameContains) q += ` and name = '${nameContains}'`;
    const url =
        `https://www.googleapis.com/drive/v3/files` +
        `?spaces=appDataFolder&fields=files(id,name,size)` +
        `&q=${encodeURIComponent(q)}`;

    const res = await fetch(url, { headers: authHeader() });
    await checkDriveResponse(res, 'Drive list');

    const json = await res.json();
    return json.files ?? [];
}

async function driveDownload(fileId: string): Promise<string> {
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: authHeader() },
    );
    await checkDriveResponse(res, 'Drive download');

    const contentType = res.headers.get('content-type') ?? '';
    const text = await res.text();

    if (contentType.includes('application/json')) {
        let maybeError: any;
        try { maybeError = JSON.parse(text); } catch (_) { /* not JSON, treat as content */ }
        if (maybeError?.error) {
            const code = maybeError.error.code ?? res.status;
            const msg = maybeError.error.message ?? 'Unknown Drive error';
            if (code === 401 || code === 403) {
                _accessToken = null;
                await AsyncStorage.removeItem(ASYNC_KEY_ACCESS_TOKEN);
                throw new DriveAuthError(`Google Drive auth error (${code}): ${msg}. Please sign in again.`);
            }
            throw new Error(`Drive download error (${code}): ${msg}`);
        }
    }

    return text;
}

async function driveUpload(name: string, content: string): Promise<string> {
    const boundary = 'IsmartDriveBoundaryXYZ789';
    const metadata = JSON.stringify({ name, parents: ['appDataFolder'] });

    const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n` +
        `${content}\r\n` +
        `--${boundary}--`;

    const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
            method: 'POST',
            headers: {
                ...authHeader(),
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body,
        },
    );
    await checkDriveResponse(res, 'Drive upload');

    const json = await res.json();
    if (!json.id) throw new Error(`Drive upload returned no file ID: ${JSON.stringify(json)}`);
    return json.id as string;
}

async function driveUpdate(fileId: string, content: string): Promise<void> {
    const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
            method: 'PATCH',
            headers: {
                ...authHeader(),
                'Content-Type': 'application/octet-stream',
            },
            body: content,
        },
    );
    await checkDriveResponse(res, 'Drive update');
}

async function driveDelete(fileId: string): Promise<void> {
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        { method: 'DELETE', headers: authHeader() },
    );
    if (!res.ok && res.status !== 404) {
        await checkDriveResponse(res, 'Drive delete');
    }
}

async function driveUpsert(name: string, content: string): Promise<string> {
    const existing = await driveList(name);

    if (existing.length > 1) {
        const extras = existing.slice(1);
        await Promise.all(extras.map(f => driveDelete(f.id)));
    }

    if (existing.length >= 1) {
        await driveUpdate(existing[0].id, content);
        return existing[0].id;
    }

    return driveUpload(name, content);
}

async function validateToken(token: string): Promise<boolean> {
    try {
        const res = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) return false;
        const json = await res.json();
        // Check token has the required scopes
        const scope: string = json.scope ?? '';
        return scope.includes('drive.appdata');
    } catch {
        return false;
    }
}


export async function signInWithGoogle(): Promise<DriveUser> {
    if (isWeb()) {
        const state = Math.random().toString(36).substring(2);
        const redirectUri = window.location.origin + '/oauth-callback';
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_redirect_uri', redirectUri);

        const authUrl =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${encodeURIComponent(WEB_CLIENT_ID!)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
            `&state=${state}` +
            `&access_type=online`;

        window.location.href = authUrl;
        return new Promise(() => { });
    }

    const isIos = Platform.OS === 'ios';
    const clientId = isIos ? IOS_CLIENT_ID : WEB_CLIENT_ID;
    const redirectUri = isIos ? IOS_REDIRECT_URI : ANDROID_REDIRECT_URI;
    const state = Math.random().toString(36).substring(2);

    const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(clientId!)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri!)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
        `&state=${state}` +
        `&access_type=online`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, 'ismart-manager://');
    if (result.type !== 'success') {
        throw new Error(
            result.type === 'cancel' ? 'Sign-in cancelled' : `Sign-in failed: ${result.type}`,
        );
    }

    const queryString = result.url.includes('?') ? result.url.split('?')[1] : '';
    const params = Object.fromEntries(
        queryString.split('&').map(p => p.split('=').map(decodeURIComponent)),
    );
    if (!params.code) throw new Error('No authorisation code returned from Google.');

    const tokenBody = [
        `code=${encodeURIComponent(params.code)}`,
        `client_id=${encodeURIComponent(clientId!)}`,
        `redirect_uri=${encodeURIComponent(redirectUri!)}`,
        `grant_type=authorization_code`,
    ];
    if (!isIos) tokenBody.push(`client_secret=${encodeURIComponent(WEB_CLIENT_SECRET!)}`);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody.join('&'),
    });

    if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        throw new Error(`Token exchange failed (${tokenRes.status}): ${errBody.slice(0, 200)}`);
    }

    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
        throw new Error(`Token exchange returned no access_token: ${JSON.stringify(tokenJson)}`);
    }

    _accessToken = tokenJson.access_token;

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${_accessToken}` },
    });

    if (!profileRes.ok) {
        throw new Error(`Failed to fetch Google profile (${profileRes.status})`);
    }

    const profile = await profileRes.json();
    _driveUser = { email: profile.email ?? 'unknown', name: profile.name ?? profile.given_name };

    await AsyncStorage.setItem(ASYNC_KEY_ACCESS_TOKEN, _accessToken!);
    await AsyncStorage.setItem(ASYNC_KEY_DRIVE_USER, JSON.stringify(_driveUser));

    return _driveUser;
}

export async function restoreDriveSession(): Promise<DriveUser | null> {
    try {
        const [token, userJson] = await Promise.all([
            AsyncStorage.getItem(ASYNC_KEY_ACCESS_TOKEN),
            AsyncStorage.getItem(ASYNC_KEY_DRIVE_USER),
        ]);

        if (!token || !userJson) return null;

        const isValid = await validateToken(token);
        if (!isValid) {
            await AsyncStorage.removeItem(ASYNC_KEY_ACCESS_TOKEN);
            await AsyncStorage.removeItem(ASYNC_KEY_DRIVE_USER);
            _accessToken = null;
            _driveUser = null;
            return null;
        }

        _accessToken = token;
        _driveUser = JSON.parse(userJson);
        return _driveUser;
    } catch (_) {
        return null;
    }
}

export async function signOutFromDrive(): Promise<void> {
    _accessToken = null;
    _driveUser = null;
    await AsyncStorage.removeItem(ASYNC_KEY_ACCESS_TOKEN);
    await AsyncStorage.removeItem(ASYNC_KEY_DRIVE_USER);
}

export function getDriveUser(): DriveUser | null { return _driveUser; }
export function isDriveAuthenticated(): boolean { return Boolean(_accessToken); }


export async function backupToDrive(
    onProgress?: (msg: string) => void,
): Promise<BackupInfo> {
    if (!isDriveAuthenticated()) throw new DriveAuthError('Not signed in to Google Drive.');

    const email = useUserStore.getState().user?.email;
    if (!email) throw new Error('No authenticated user.');

    const randomString = useEncryptionStore.getState().randomString;
    if (!randomString) throw new Error('Encryption key not loaded.');

    onProgress?.('Checking existing backup…');
    let existingSecrets: Secret[] = [];
    let existingContacts: AppContact[] = [];
    let version = 1;

    try {
        const backupFiles = await driveList(BACKUP_FILE_NAME);
        if (backupFiles.length > 0) {
            const raw = await driveDownload(backupFiles[0].id);
            const plaintext = await decryptPayload(raw, email);
            const payload = JSON.parse(plaintext) as BackupPayload;
            existingSecrets = payload.secrets ?? [];
            existingContacts = payload.contacts ?? [];
            version = (payload.version ?? 0) + 1;
        }
    } catch (e) {
        if (e instanceof DriveAuthError) throw e;
        console.warn('Could not read existing backup (starting fresh):', e);
    }

    onProgress?.('Reading new / changed secrets…');
    const unsyncedSecrets = await SecretsApi.getUnsynced();

    onProgress?.('Merging secrets…');
    const secretMap = new Map<string, Secret>(
        existingSecrets
            .filter(s => s.id && s.secret)
            .map(s => [s.id, s]),
    );
    for (const s of unsyncedSecrets) {
        if (s.id && s.secret) secretMap.set(s.id, s);
    }
    const mergedSecrets = Array.from(secretMap.values());

    onProgress?.('Reading contacts…');
    const contactsJson = await AsyncStorage.getItem(`@contacts_${email}`);
    const contacts: AppContact[] = contactsJson ? JSON.parse(contactsJson) : existingContacts;

    onProgress?.('Encrypting backup…');
    const payload: BackupPayload = {
        version,
        ts: Date.now(),
        secrets: mergedSecrets,
        contacts,
        randomString,
    };

    const payloadJson = JSON.stringify(payload);
    if (!payloadJson || !payloadJson.startsWith('{')) {
        throw new Error('Failed to serialise backup payload.');
    }

    const encryptedContent = await encryptPayload(payloadJson, email);

    try {
        JSON.parse(encryptedContent);
    } catch {
        throw new Error('Encryption produced invalid output — aborting upload to protect data.');
    }

    onProgress?.('Uploading to Google Drive…');
    await driveUpsert(BACKUP_FILE_NAME, encryptedContent);

    const manifest: BackupInfo = {
        version,
        ts: Date.now(),
        secretCount: mergedSecrets.length,
        contactCount: contacts.length,
        fileSize: encryptedContent.length,
    };
    await driveUpsert(MANIFEST_FILE_NAME, JSON.stringify(manifest));

    onProgress?.('Marking secrets as synced…');
    await SecretsApi.markSynced(unsyncedSecrets.map(s => s.id));

    onProgress?.('Backup complete ✓');
    return manifest;
}


export async function restoreFromDrive(
    onProgress?: (msg: string) => void,
): Promise<void> {
    if (!isDriveAuthenticated()) throw new DriveAuthError('Not signed in to Google Drive.');

    const email = useUserStore.getState().user?.email;
    if (!email) throw new Error('No authenticated user.');

    onProgress?.('Finding backup…');
    const files = await driveList(BACKUP_FILE_NAME);
    if (!files.length) throw new Error('No backup found on Google Drive.');

    onProgress?.('Downloading backup…');
    const raw = await driveDownload(files[0].id);

    if (!raw || !raw.trim()) {
        throw new Error('Downloaded backup file is empty.');
    }

    onProgress?.('Decrypting backup…');
    let plaintext: string;
    try {
        plaintext = await decryptPayload(raw, email);
    } catch (e) {
        if (e instanceof DriveAuthError) throw e;
        throw new Error(
            `Failed to decrypt backup: ${(e as Error).message}\n\n` +
            `This usually means the backup was created with a different Google account or the file is corrupted.`,
        );
    }

    let payload: BackupPayload;
    try {
        payload = JSON.parse(plaintext);
    } catch (e) {
        const err = e as SyntaxError;
        throw new Error(
            `Backup data is corrupted (JSON parse failed: ${err.message}). ` +
            `Try creating a fresh backup from your primary device.`,
        );
    }

    if (!payload || typeof payload !== 'object') {
        throw new Error('Backup payload has unexpected shape — restore aborted.');
    }
    if (!payload.randomString) {
        throw new Error('Backup is missing encryption key — restore aborted to protect your data.');
    }

    onProgress?.('Restoring encryption key…');
    await useEncryptionStore.getState().saveRandomString(email, payload.randomString);

    onProgress?.('Restoring secrets…');
    if (Array.isArray(payload.secrets) && payload.secrets.length > 0) {
        await SecretsApi.bulkUpsert(payload.secrets);
    }

    onProgress?.('Restoring contacts…');
    if (Array.isArray(payload.contacts) && payload.contacts.length > 0) {
        await AsyncStorage.setItem(`@contacts_${email}`, JSON.stringify(payload.contacts));
        useContactsStore.getState().setContacts(payload.contacts);
    }

    onProgress?.('Restore complete ✓');
}


export async function getBackupInfo(): Promise<BackupInfo | null> {
    if (!isDriveAuthenticated()) return null;
    try {
        const files = await driveList(MANIFEST_FILE_NAME);
        if (!files.length) return null;
        const raw = await driveDownload(files[0].id);
        // Manifest is not encrypted — just plain JSON
        if (!raw.trim().startsWith('{')) return null;
        return JSON.parse(raw) as BackupInfo;
    } catch (_) {
        return null;
    }
}


export async function deleteAllBackupFiles(): Promise<void> {
    const [files, manifests] = await Promise.all([
        driveList(BACKUP_FILE_NAME),
        driveList(MANIFEST_FILE_NAME),
    ]);
    await Promise.all([
        ...files.map(f => driveDelete(f.id)),
        ...manifests.map(f => driveDelete(f.id)),
    ]);
}