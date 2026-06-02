import { useCallback, useEffect, useRef, useState } from 'react';
import {
    BackupInfo,
    DriveAuthError,
    DriveUser,
    SyncStatus,
    backupToDrive,
    getBackupInfo,
    getDriveUser,
    isDriveAuthenticated,
    restoreDriveSession,
    restoreFromDrive,
    signInWithGoogle,
    signOutFromDrive,
} from '../utils/GoogleDriveSync';

const AUTO_BACKUP_INTERVAL_MS = 60 * 60 * 1000;

export function useDriveSync() {
    const [user, setUser] = useState<DriveUser | null>(getDriveUser());
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [syncMessage, setSyncMessage] = useState('');
    const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
    const autoBackupTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const refreshBackupInfo = useCallback(async () => {
        try {
            const info = await getBackupInfo();
            setBackupInfo(info);
        } catch (_) {
        }
    }, []);

    const handleError = useCallback((e: unknown) => {
        const isAuthError = e instanceof DriveAuthError;
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';

        setSyncStatus('error');
        setSyncMessage(message);

        if (isAuthError) {
            setUser(null);
            setBackupInfo(null);
            stopAutoBackup();
        }
    }, []);

    const stopAutoBackup = useCallback(() => {
        if (autoBackupTimer.current) {
            clearInterval(autoBackupTimer.current);
            autoBackupTimer.current = null;
        }
    }, []);

    const startAutoBackup = useCallback(() => {
        stopAutoBackup();
        autoBackupTimer.current = setInterval(async () => {
            if (!isDriveAuthenticated()) return;
            try {
                await backupToDrive();
                await refreshBackupInfo();
            } catch (e) {
                if (e instanceof DriveAuthError) {
                    handleError(e);
                }
            }
        }, AUTO_BACKUP_INTERVAL_MS);
    }, [refreshBackupInfo, handleError, stopAutoBackup]);

    useEffect(() => {
        (async () => {
            const restoredUser = await restoreDriveSession();
            if (restoredUser) {
                setUser(restoredUser);
                await refreshBackupInfo();
                startAutoBackup();
            }
        })();

        return () => stopAutoBackup();
    }, []);

    const login = useCallback(async () => {
        setSyncStatus('syncing');
        setSyncMessage('Signing in to Google…');
        try {
            const u = await signInWithGoogle();
            setUser(u);
            await refreshBackupInfo();
            setSyncStatus('success');
            setSyncMessage('Signed in ✓');
            startAutoBackup();
        } catch (e) {
            handleError(e);
        }
    }, [refreshBackupInfo, startAutoBackup, handleError]);

    const logout = useCallback(async () => {
        stopAutoBackup();
        await signOutFromDrive();
        setUser(null);
        setBackupInfo(null);
        setSyncStatus('idle');
        setSyncMessage('');
    }, [stopAutoBackup]);

    const backup = useCallback(async () => {
        if (!isDriveAuthenticated()) {
            setSyncStatus('error');
            setSyncMessage('Please sign in to Google first.');
            return;
        }
        setSyncStatus('syncing');
        setSyncMessage('');
        try {
            await backupToDrive((msg) => setSyncMessage(msg));
            await refreshBackupInfo();
            setSyncStatus('success');
        } catch (e) {
            handleError(e);
        }
    }, [refreshBackupInfo, handleError]);

    const restore = useCallback(async () => {
        if (!isDriveAuthenticated()) {
            setSyncStatus('error');
            setSyncMessage('Please sign in to Google first.');
            return;
        }
        setSyncStatus('syncing');
        setSyncMessage('');
        try {
            await restoreFromDrive((msg) => setSyncMessage(msg));
            setSyncStatus('success');
            setSyncMessage('Restore complete ✓');
        } catch (e) {
            handleError(e);
        }
    }, [handleError]);

    return {
        user,
        syncStatus,
        syncMessage,
        backupInfo,
        login,
        logout,
        backup,
        restore,
    };
}