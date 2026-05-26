import { useContactsStore } from '@/store/ContactsStore';
import { useEncryptionStore } from '@/store/EncryptionStore';
import { useUserStore } from '@/store/UserStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Secret } from '../api/Secrets/types';
import type { AppContact } from '../interfaces/Contacts';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;

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
    randomStringEncrypted: string;
}

export interface BackupInfo {
    version: number;
    ts: number;
    secretCount: number;
    contactCount: number;
    fileSize: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

let _accessToken: string | null = null;
let _driveUser: DriveUser | null = null;

function getSubtle(): SubtleCrypto | null {
    console.log('globalThis.crypto', !!globalThis?.crypto);
    console.log('globalThis.crypto.subtle', !!globalThis?.crypto?.subtle);

    console.log('window.crypto', typeof window !== 'undefined' ? !!window.crypto : 'no window');
    console.log(
        'window.crypto.subtle',
        typeof window !== 'undefined'
            ? !!window.crypto?.subtle
            : 'no window'
    );

    return globalThis?.crypto?.subtle ??
        window?.crypto?.subtle ??
        null;
}

function isWeb(): boolean {
    try {
        return (
            typeof window !== 'undefined' &&
            typeof window.location !== 'undefined' &&
            typeof window.location.protocol === 'string' &&
            window.location.protocol.startsWith('http') &&
            getSubtle() !== null
        );
    } catch {
        return false;
    }
}


function authHeader() {
    if (!_accessToken) throw new Error('Not signed in to Google Drive.');
    return { Authorization: `Bearer ${_accessToken}` };
}

async function driveList(nameContains?: string): Promise<Array<{ id: string; name: string; size?: string }>> {
    let q = `'appDataFolder' in parents`;
    if (nameContains) q += ` and name = '${nameContains}'`;
    const url =
        `https://www.googleapis.com/drive/v3/files` +
        `?spaces=appDataFolder&fields=files(id,name,size)` +
        `&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: authHeader() });
    if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
    const json = await res.json();
    return json.files ?? [];
}

async function driveDownload(fileId: string): Promise<string> {
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: authHeader() },
    );
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Drive download failed: ${res.status} — ${errText.slice(0, 100)}`);
    }
    return res.text();
}

async function driveUpload(name: string, content: string): Promise<string> {
    const boundary = 'ismart_boundary_xyz';
    const metadata = JSON.stringify({ name, parents: ['appDataFolder'] });
    const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
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
    if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
    const json = await res.json();
    return json.id as string;
}

async function driveUpdate(fileId: string, content: string): Promise<void> {
    const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
            method: 'PATCH',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: content,
        },
    );
    if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
}

async function driveDelete(fileId: string): Promise<void> {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: authHeader(),
    });
}

async function driveUpsert(name: string, content: string): Promise<string> {
    const existing = await driveList(name);
    if (existing.length > 0) {
        await driveUpdate(existing[0].id, content);
        return existing[0].id;
    }
    return driveUpload(name, content);
}


async function sha256Native(data: Uint8Array): Promise<Uint8Array> {
    const hex = Array.from(data)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    const hashHex = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        hex,
        { encoding: Crypto.CryptoEncoding.HEX }
    );
    return new Uint8Array((hashHex.match(/.{1,2}/g) as string[]).map(b => parseInt(b, 16)));
}

async function deriveBackupKeyNative(email: string): Promise<Uint8Array> {
    let key = new TextEncoder().encode(email + BACKUP_SALT);
    for (let i = 0; i < 1000; i++) {
        key = await sha256Native(key);
    }
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
    const trimmed = encryptedJson.trim();
    if (!trimmed.startsWith('{')) {
        throw new Error(`Expected JSON but got: "${trimmed.slice(0, 80)}"`);
    }
    const key = await deriveBackupKeyNative(email);
    const keyArr = Array.from(key);
    const parsed: { cipher: string; iv: string; web?: boolean } = JSON.parse(trimmed);
    const ivArr = Array.from(aesjs.utils.hex.toBytes(parsed.iv));
    const cipherArr = Array.from(aesjs.utils.hex.toBytes(parsed.cipher));
    const aesCbc = new aesjs.ModeOfOperation.cbc(keyArr, ivArr);
    const decrypted = aesCbc.decrypt(cipherArr);
    const padLen = decrypted[decrypted.length - 1];
    return aesjs.utils.utf8.fromBytes(decrypted.slice(0, decrypted.length - padLen));
}

async function deriveBackupKeyWeb(email: string): Promise<CryptoKey> {
    const subtle = getSubtle();
    if (!subtle) throw new Error('SubtleCrypto not available');
    const raw = new TextEncoder().encode(email + BACKUP_SALT);
    const keyMaterial = await subtle.importKey(
        'raw', raw, { name: 'PBKDF2' }, false, ['deriveKey'],
    );
    return subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new TextEncoder().encode(email),
            iterations: 1000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-CBC', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    );
}


async function encryptPayload(
    plaintext: string,
    email: string,
): Promise<string> {
    return encryptPayloadNative(plaintext, email);
}

async function decryptPayload(
    encryptedJson: string,
    email: string,
): Promise<string> {
    return decryptPayloadNative(encryptedJson, email);
}


const IOS_REDIRECT_URI = process.env.EXPO_PUBLIC_IOS_REDIRECT_URI;
const ANDROID_REDIRECT_URI = process.env.EXPO_PUBLIC_ANDROID_REDIRECT_URI;
const WEB_CLIENT_SECRET = process.env.EXPO_PUBLIC_WEB_CLIENT_SECRET;

export async function signInWithGoogle(): Promise<DriveUser> {
    if (isWeb()) {
        const state = Math.random().toString(36).substring(2);
        sessionStorage.setItem('oauth_state', state);

        const redirectUri = window.location.origin + '/oauth-callback';
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

    const returnUrl = result.url;
    const queryString = returnUrl.includes('?') ? returnUrl.split('?')[1] : '';
    const params = Object.fromEntries(
        queryString.split('&').map(p => p.split('=').map(decodeURIComponent)),
    );

    if (!params.code) throw new Error('No authorization code returned');

    const tokenBody = [
        `code=${encodeURIComponent(params.code)}`,
        `client_id=${encodeURIComponent(clientId!)}`,
        `redirect_uri=${encodeURIComponent(redirectUri!)}`,
        `grant_type=authorization_code`,
    ];

    if (!isIos) {
        tokenBody.push(`client_secret=${encodeURIComponent(WEB_CLIENT_SECRET!)}`);
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody.join('&'),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenJson)}`);
    }

    _accessToken = tokenJson.access_token;

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${_accessToken}` },
    });
    const profile = await profileRes.json();
    _driveUser = {
        email: profile.email ?? 'unknown',
        name: profile.name ?? profile.given_name ?? undefined,
    };

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
        if (token && userJson) {
            _accessToken = token;
            _driveUser = JSON.parse(userJson);
            return _driveUser;
        }
    } catch (_) { }
    return null;
}

export async function signOutFromDrive(): Promise<void> {
    _accessToken = null;
    _driveUser = null;
    await AsyncStorage.removeItem(ASYNC_KEY_ACCESS_TOKEN);
    await AsyncStorage.removeItem(ASYNC_KEY_DRIVE_USER);
}

export function getDriveUser(): DriveUser | null {
    return _driveUser;
}

export function isDriveAuthenticated(): boolean {
    return Boolean(_accessToken);
}


export async function backupToDrive(
    onProgress?: (msg: string) => void,
): Promise<BackupInfo> {
    if (!isDriveAuthenticated()) throw new Error('Not signed in to Google Drive.');

    const email = useUserStore.getState().user?.email;
    if (!email) throw new Error('No authenticated user.');

    const randomString = useEncryptionStore.getState().randomString;
    if (!randomString) throw new Error('Encryption key not loaded.');

    onProgress?.('Reading secrets…');
    const secretsJson = await AsyncStorage.getItem(
        `secrets_${email.replace(/[^a-zA-Z0-9_]/g, '_')}`,
    );
    const secrets: Secret[] = secretsJson ? JSON.parse(secretsJson) : [];

    onProgress?.('Reading contacts…');
    const contactsJson = await AsyncStorage.getItem(`@contacts_${email}`);
    const contacts: AppContact[] = contactsJson ? JSON.parse(contactsJson) : [];

    let version = 1;
    try {
        const manifestFiles = await driveList(MANIFEST_FILE_NAME);
        if (manifestFiles.length > 0) {
            const raw = await driveDownload(manifestFiles[0].id);
            const manifest = JSON.parse(raw);
            version = (manifest.version ?? 0) + 1;
        }
    } catch (_) { }

    onProgress?.('Encrypting backup…');
    const plaintext = JSON.stringify({ version, ts: Date.now(), secrets, contacts, randomString });
    const encryptedContent = await encryptPayload(plaintext, email);

    onProgress?.('Uploading to Google Drive…');
    await driveUpsert(BACKUP_FILE_NAME, encryptedContent);

    const manifest = {
        version,
        ts: Date.now(),
        secretCount: secrets.length,
        contactCount: contacts.length,
        fileSize: encryptedContent.length,
    };
    await driveUpsert(MANIFEST_FILE_NAME, JSON.stringify(manifest));

    onProgress?.('Backup complete ✓');
    return manifest;
}

export async function restoreFromDrive(
    onProgress?: (msg: string) => void,
): Promise<void> {
    
    console.log('RESTORE START');
    if (!isDriveAuthenticated()) throw new Error('Not signed in to Google Drive.');

    const email = useUserStore.getState().user?.email;
    if (!email) throw new Error('No authenticated user.');

    onProgress?.('Finding backup…');
    const files = await driveList(BACKUP_FILE_NAME);
    if (!files.length) throw new Error('No backup found on Google Drive.');

    onProgress?.('Downloading backup…');
    const raw = await driveDownload(files[0].id);

    onProgress?.('Decrypting backup…');
    let plaintext: string;
    try {
        plaintext = await decryptPayload(raw, email);
    } catch (e) {
        throw new Error(`Decrypt failed: ${e}`);
    }

    const payload = JSON.parse(plaintext) as {
        version: number;
        ts: number;
        secrets: Secret[];
        contacts: AppContact[];
        randomString: string;
    };

    console.log('RESTORE PAYLOAD');
    console.log('secrets:', payload.secrets?.length);
    console.log('contacts:', payload.contacts?.length);
    console.log('randomString:', !!payload.randomString);

    onProgress?.('Restoring encryption key…');
    await useEncryptionStore.getState().saveRandomString(email, payload.randomString);

    onProgress?.('Restoring secrets…');
    const secretsKey = `secrets_${email.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    await AsyncStorage.setItem(secretsKey, JSON.stringify(payload.secrets));

    const verifySecrets = await AsyncStorage.getItem(secretsKey);

    console.log(
        'saved secrets',
        JSON.parse(verifySecrets || '[]').length
    );

    onProgress?.('Restoring contacts…');
    if (payload.contacts?.length) {
        await AsyncStorage.setItem(`@contacts_${email}`, JSON.stringify(payload.contacts));
        useContactsStore.getState().setContacts(payload.contacts);
    }

    onProgress?.('Restore complete ✓');
    console.log('RESTORE COMPLETE');
}

export async function getBackupInfo(): Promise<BackupInfo | null> {
    if (!isDriveAuthenticated()) return null;
    try {
        const files = await driveList(MANIFEST_FILE_NAME);
        if (!files.length) return null;
        const raw = await driveDownload(files[0].id);
        return JSON.parse(raw) as BackupInfo;
    } catch (_) {
        return null;
    }
}

export async function deleteAllBackupFiles(): Promise<void> {
    const files = await driveList(BACKUP_FILE_NAME);
    for (const f of files) await driveDelete(f.id);
    const manifests = await driveList(MANIFEST_FILE_NAME);
    for (const f of manifests) await driveDelete(f.id);
}
