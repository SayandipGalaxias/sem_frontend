import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { useDriveSync } from '../hooks/userDriveSync';
import { BackupInfo, SyncStatus } from '../utils/GoogleDriveSync';

const TABLET_WIDTH = 768;


function formatRelative(ts: number): string {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60_000);
    const hr = Math.floor(diff / 3_600_000);
    const day = Math.floor(diff / 86_400_000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    return `${day}d ago`;
}

function formatBytes(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}


function StatusBanner({
    status,
    message,
}: {
    status: SyncStatus;
    message: string;
}) {
    if (!message || status === 'idle') return null;

    const config: Record<string, { color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
        syncing: { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', icon: 'sync-outline' },
        success: { color: '#22c55e', bg: 'rgba(34,197,94,0.10)', icon: 'checkmark-circle-outline' },
        error: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: 'alert-circle-outline' },
    };
    const c = config[status] ?? config.syncing;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: c.bg,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: c.color + '33',
            }}
        >
            {status === 'syncing' ? (
                <ActivityIndicator size="small" color={c.color} />
            ) : (
                <Ionicons name={c.icon} size={16} color={c.color} />
            )}
            <Text style={{ flex: 1, fontSize: 13, color: c.color, lineHeight: 18 }}>
                {message}
            </Text>
        </View>
    );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(74,111,165,0.08)',
            }}
        >
            <Text style={{ fontSize: 13, color: '#8a93a6' }}>{label}</Text>
            <Text style={{ fontSize: 13, color: '#8a93a6', fontFamily: mono ? Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) : undefined }}
                className="dark:text-white">
                {value}
            </Text>
        </View>
    );
}

function BackupInfoCard({ info }: { info: BackupInfo | null }) {
    if (!info) {
        return (
            <View
                className="bg-[#dce1ec] dark:bg-zinc-900"
                style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
            >
                <Text style={{ color: '#8a93a6', fontSize: 13, textAlign: 'center', paddingVertical: 8 }}>
                    No backup found on Google Drive yet
                </Text>
            </View>
        );
    }

    return (
        <View
            className="bg-[#dce1ec] dark:bg-zinc-900"
            style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(74,111,165,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="cloud-done-outline" size={18} color="#4a6fa5" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700' }} className="text-black dark:text-white">Last Backup</Text>
            </View>

            <InfoRow label="Backed up" value={formatRelative(info.ts)} />
            <InfoRow label="Secrets" value={String(info.secretCount)} />
            <InfoRow label="Contacts" value={String(info.contactCount)} />
            <InfoRow label="Backup size" value={formatBytes(info.fileSize)} mono />
            <InfoRow label="Version" value={`v${info.version}`} mono />
        </View>
    );
}


export default function BackupScreen() {
    const { user, syncStatus, syncMessage, backupInfo, login, logout, backup, restore } =
        useDriveSync();

    const { width } = useWindowDimensions();
    const isTablet = width >= TABLET_WIDTH;
    const router = useRouter();

    const px = isTablet ? 32 : 20;

    const confirmRestore = () => {
        Alert.alert(
            'Restore from Google Drive',
            'This will overwrite your local secrets, contacts, and encryption key with the cloud backup. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Restore', style: 'destructive', onPress: restore },
            ],
        );
    };

    const confirmLogout = () => {
        Alert.alert(
            'Disconnect Google Drive',
            'Auto-backup will stop. Your local data is not affected.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Disconnect', style: 'destructive', onPress: logout },
            ],
        );
    };

    return (
        <View className='flex-1 bg-[#e8ecf4] dark:bg-black'>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: px,
                    paddingTop: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(74,111,165,0.10)',
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#dce1ec',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}
                    className="dark:bg-zinc-900"
                >
                    <Ionicons name="chevron-back" size={20} color="#4a6fa5" />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '600' }} className="text-black dark:text-white">
                    Cloud Backup
                </Text>
            </View>

            <ScrollView
                className="flex-1 bg-[#e8ecf4] dark:bg-black"
                contentContainerStyle={{ paddingHorizontal: px, paddingVertical: 24, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <StatusBanner status={syncStatus} message={syncMessage} />

                <View
                    className="bg-[#dce1ec] dark:bg-zinc-900"
                    style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
                >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#8a93a6', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 }}>
                        Google Account
                    </Text>

                    {user ? (
                        <View style={{ gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                                        {(user.name ?? user.email)[0].toUpperCase()}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    {user.name && (
                                        <Text style={{ fontSize: 14, fontWeight: '600' }} className="text-black dark:text-white">
                                            {user.name}
                                        </Text>
                                    )}
                                    <Text style={{ fontSize: 12, color: '#8a93a6' }}>{user.email}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.10)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                                    <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: '600' }}>Connected</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={confirmLogout}
                                activeOpacity={0.75}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    borderRadius: 14,
                                    paddingVertical: 12,
                                    backgroundColor: 'rgba(239,68,68,0.08)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(239,68,68,0.15)',
                                }}
                            >
                                <Ionicons name="log-out-outline" size={15} color="#ef4444" />
                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Disconnect Drive</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ gap: 12 }}>
                            <Text style={{ fontSize: 13, color: '#8a93a6', lineHeight: 18 }}>
                                Sign in to enable automatic backup and restore across devices.
                            </Text>
                            <TouchableOpacity
                                onPress={login}
                                disabled={syncStatus === 'syncing'}
                                activeOpacity={0.85}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    borderRadius: 14,
                                    paddingVertical: 14,
                                    backgroundColor: '#4285F4',
                                    opacity: syncStatus === 'syncing' ? 0.6 : 1,
                                }}
                            >
                                {syncStatus === 'syncing' && !user ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="logo-google" size={18} color="#fff" />
                                )}
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                                    Sign in with Google
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <BackupInfoCard info={backupInfo} />

                <View
                    className="bg-[#dce1ec] dark:bg-zinc-900"
                    style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
                >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#8a93a6', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                        Backup
                    </Text>
                    <Text style={{ fontSize: 12, color: '#8a93a6', lineHeight: 18, marginBottom: 16 }}>
                        Runs automatically every hour. Tap below to back up right now.
                    </Text>
                    <TouchableOpacity
                        onPress={backup}
                        disabled={!user || syncStatus === 'syncing'}
                        activeOpacity={0.85}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            borderRadius: 14,
                            paddingVertical: 14,
                            backgroundColor: '#4a6fa5',
                            opacity: !user || syncStatus === 'syncing' ? 0.5 : 1,
                        }}
                    >
                        {syncStatus === 'syncing' && syncMessage.includes('Upload') ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                        )}
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Backup Now</Text>
                    </TouchableOpacity>
                </View>

                <View
                    className="bg-[#dce1ec] dark:bg-zinc-900"
                    style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
                >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#8a93a6', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                        Restore
                    </Text>
                    <Text style={{ fontSize: 12, color: '#8a93a6', lineHeight: 18, marginBottom: 12 }}>
                        Downloads your latest backup and restores secrets, contacts, and encryption key. Use this when setting up a new device.
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(239,68,68,0.07)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' }}>
                        <Ionicons name="warning-outline" size={15} color="#ef4444" style={{ marginTop: 1 }} />
                        <Text style={{ flex: 1, fontSize: 12, color: '#ef4444', lineHeight: 18 }}>
                            This will overwrite your current local data. Ensure you have a recent backup first.
                        </Text>
                    </View>

                    <TouchableOpacity
                        // onPress={confirmRestore}
                         onPress={restore}
                        disabled={!user || syncStatus === 'syncing'}
                        activeOpacity={0.85}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            borderRadius: 14,
                            paddingVertical: 14,
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            borderColor: '#4a6fa5',
                            opacity: !user || syncStatus === 'syncing' ? 0.5 : 1,
                        }}
                    >
                        {syncStatus === 'syncing' && syncMessage.includes('Restore') ? (
                            <ActivityIndicator size="small" color="#4a6fa5" />
                        ) : (
                            <Ionicons name="cloud-download-outline" size={18} color="#4a6fa5" />
                        )}
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#4a6fa5' }}>Restore from Drive</Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={{
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(74,111,165,0.15)',
                        borderLeftWidth: 3,
                        borderLeftColor: '#4a6fa5',
                        padding: 16,
                        gap: 8,
                    }}
                    className="bg-[#dce1ec] dark:bg-zinc-900"
                >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#8a93a6', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                        How It Works
                    </Text>
                    {[
                        'Secrets stay AES-256 encrypted — Drive never sees plaintext',
                        'Your encryption key is re-encrypted with your email before upload',
                        'Auto-backup runs every hour while Drive is connected',
                        'Restore replaces local data with the latest Drive snapshot',
                        'Files live in your private appDataFolder — not visible in My Drive',
                    ].map((line) => (
                        <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
                            <Text style={{ color: '#4a6fa5', fontSize: 12, marginTop: 1 }}>›</Text>
                            <Text style={{ flex: 1, fontSize: 12, color: '#8a93a6', lineHeight: 18 }}>{line}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity onPress={async () => {
                    const { deleteAllBackupFiles } = await import('../utils/GoogleDriveSync');
                    await deleteAllBackupFiles();
                    alert('Deleted');
                }}>
                    <Text>DEL</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>

    );
}