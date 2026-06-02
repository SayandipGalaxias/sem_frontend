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


type BannerConfig = {
    color: string;
    bg: string;
    border: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
};

const BANNER_CONFIG: Record<string, BannerConfig> = {
    syncing: {
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.08)',
        border: 'rgba(59,130,246,0.20)',
        icon: 'sync-outline',
    },
    success: {
        color: '#16a34a',
        bg: 'rgba(22,163,74,0.08)',
        border: 'rgba(22,163,74,0.20)',
        icon: 'checkmark-circle-outline',
    },
    error: {
        color: '#dc2626',
        bg: 'rgba(220,38,38,0.08)',
        border: 'rgba(220,38,38,0.20)',
        icon: 'alert-circle-outline',
    },
};

function StatusBanner({ status, message }: { status: SyncStatus; message: string }) {
    if (!message || status === 'idle') return null;
    const c = BANNER_CONFIG[status] ?? BANNER_CONFIG.syncing;
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: c.bg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 11,
                marginBottom: 12,
                borderWidth: 0.5,
                borderColor: c.border,
            }}
        >
            {status === 'syncing' ? (
                <ActivityIndicator size="small" color={c.color} />
            ) : (
                <Ionicons name={c.icon} size={15} color={c.color} />
            )}
            <Text style={{ flex: 1, fontSize: 13, color: c.color, lineHeight: 18 }}>
                {message}
            </Text>
        </View>
    );
}


function SectionLabel({ children }: { children: string }) {
    return (
        <Text
            style={{
                fontSize: 11,
                fontWeight: '600',
                color: '#8a93a6',
                textTransform: 'uppercase',
                letterSpacing: 1.1,
                marginBottom: 14,
            }}
        >
            {children}
        </Text>
    );
}


function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 9,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(74,111,165,0.10)',
            }}
        >
            <Text style={{ fontSize: 13, color: '#8a93a6' }}>{label}</Text>
            <Text
                style={{
                    fontSize: 13,
                    color: '#4a4a4a',
                    fontFamily: mono
                        ? Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })
                        : undefined,
                }}
                className="dark:text-white"
            >
                {value}
            </Text>
        </View>
    );
}


function Card({ children, style, }: { children: React.ReactNode; style?: object; }) {
    const { width } = useWindowDimensions();

    const padding = width >= 1200 ? 24 : width >= 768 ? 20 : 18;

    return (
        <View
            className="bg-white dark:bg-zinc-900"
            style={{
                borderRadius: 16,
                padding,
                marginBottom: 12,
                borderWidth: 0.5,
                borderColor: 'rgba(74,111,165,0.12)',
                ...style,
            }}
        >
            {children}
        </View>
    );
}


function BackupInfoCard({ info }: { info: BackupInfo | null }) {
    if (!info) {
        return (
            <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <View
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: 'rgba(74,111,165,0.10)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="cloud-outline" size={16} color="#4a6fa5" />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600' }} className="text-black dark:text-white">
                        Last backup
                    </Text>
                </View>
                <Text style={{ fontSize: 13, color: '#8a93a6', paddingTop: 8 }}>
                    No backup found on Google Drive yet
                </Text>
            </Card>
        );
    }

    return (
        <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: 'rgba(74,111,165,0.10)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="cloud-done-outline" size={16} color="#4a6fa5" />
                </View>
                <View>
                    <Text style={{ fontSize: 14, fontWeight: '600' }} className="text-black dark:text-white">
                        Last backup
                    </Text>
                    <Text style={{ fontSize: 12, color: '#8a93a6', marginTop: 1 }}>
                        {formatRelative(info.ts)}
                    </Text>
                </View>
            </View>
            <InfoRow label="Secrets" value={String(info.secretCount)} />
            <InfoRow label="Contacts" value={String(info.contactCount)} />
            <InfoRow label="Backup size" value={formatBytes(info.fileSize)} mono />
            <View style={{ paddingVertical: 9 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#8a93a6' }}>Version</Text>
                    <Text
                        style={{
                            fontSize: 13,
                            color: '#4a4a4a',
                            fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
                        }}
                        className="dark:text-white"
                    >
                        v{info.version}
                    </Text>
                </View>
            </View>
        </Card>
    );
}


const HOW_IT_WORKS = [
    'Secrets stay AES-256 encrypted — Drive never sees plaintext',
    'Your encryption key is re-encrypted with your email before upload',
    'Auto-backup runs every hour while Drive is connected',
    'Restore replaces local data with the latest Drive snapshot',
    'Files live in your private appDataFolder — not visible in My Drive',
];

function HowItWorksCard() {
    return (
        <View
            className="bg-white dark:bg-zinc-900"
            style={{
                borderRadius: 16,
                padding: 18,
                marginBottom: 12,
            }}
        >
            <SectionLabel>How it works</SectionLabel>
            <View style={{ gap: 9 }}>
                {HOW_IT_WORKS.map((line) => (
                    <View key={line} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                        <Text style={{ color: '#4a6fa5', fontSize: 13, lineHeight: 18 }}>›</Text>
                        <Text style={{ flex: 1, fontSize: 12, color: '#8a93a6', lineHeight: 18 }}>
                            {line}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}


function PrimaryButton({
    label,
    icon,
    onPress,
    disabled,
    loading,
    variant = 'filled',
}: {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'filled' | 'outline';
}) {
    const isFilled = variant === 'filled';
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 12,
                paddingVertical: 13,
                backgroundColor: isFilled ? '#4a6fa5' : 'transparent',
                borderWidth: isFilled ? 0 : 1,
                borderColor: '#4a6fa5',
                opacity: disabled ? 0.45 : 1,
            }}
        >
            {loading ? (
                <ActivityIndicator size="small" color={isFilled ? '#fff' : '#4a6fa5'} />
            ) : (
                <Ionicons name={icon} size={17} color={isFilled ? '#fff' : '#4a6fa5'} />
            )}
            <Text
                style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: isFilled ? '#fff' : '#4a6fa5',
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}


export default function BackupScreen() {
    const { user, syncStatus, syncMessage, backupInfo, login, logout, backup, restore } = useDriveSync();

    const { width } = useWindowDimensions();
    const router = useRouter();

    const isTablet = width >= 768;
    const isDesktop = width >= 1200;

    const px = isDesktop ? 48 : isTablet ? 32 : 20;
    const maxWidth = isTablet ? 600 : undefined;

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
        <View className="flex-1 bg-[#e8ecf4] dark:bg-black">
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: px,
                    paddingTop: 16,
                    paddingBottom: 14,
                    borderBottomWidth: 0.5,
                    borderBottomColor: 'rgba(74,111,165,0.12)',
                }}
            >
                <View style={{ flex: 1, alignItems: isTablet ? 'center' : 'flex-start', flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.75}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: 'rgba(74,111,165,0.08)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="chevron-back" size={19} color="#4a6fa5" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: isDesktop ? 24 : 17, fontWeight: '700', alignSelf: 'center' }} className="text-black dark:text-white">
                        Cloud backup
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1"
                contentContainerStyle={{
                    paddingHorizontal: px,
                    paddingVertical: 24,
                    paddingBottom: 60,
                }}
                showsVerticalScrollIndicator={false}
            >
                <StatusBanner status={syncStatus} message={syncMessage} />
                {
                    isTablet ? (
                        <View
                            style={{
                                flexDirection: 'row',
                                gap: 20,
                                alignItems: 'flex-start',
                                width: '100%',
                                maxWidth: 1300,
                                alignSelf: 'center',
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Card>
                                    <SectionLabel>Google account</SectionLabel>
                                    {user ? (
                                        <View style={{ gap: 14 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <View
                                                    style={{
                                                        width: 42,
                                                        height: 42,
                                                        borderRadius: 21,
                                                        backgroundColor: '#4285F4',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
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
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        backgroundColor: 'rgba(22,163,74,0.10)',
                                                        borderRadius: 20,
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 4,
                                                    }}
                                                >
                                                    <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                                                    <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '600' }}>Connected</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                onPress={logout}
                                                activeOpacity={0.75}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 7,
                                                    borderRadius: 12,
                                                    paddingVertical: 11,
                                                    backgroundColor: 'rgba(220,38,38,0.06)',
                                                    borderWidth: 0.5,
                                                    borderColor: 'rgba(220,38,38,0.18)',
                                                }}
                                            >
                                                <Ionicons name="log-out-outline" size={15} color="#dc2626" />
                                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#dc2626' }}>
                                                    Disconnect Drive
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ gap: 14 }}>
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
                                                    borderRadius: 12,
                                                    paddingVertical: 13,
                                                    backgroundColor: '#4285F4',
                                                    opacity: syncStatus === 'syncing' ? 0.6 : 1,
                                                }}
                                            >
                                                {syncStatus === 'syncing' && !user ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Ionicons name="logo-google" size={17} color="#fff" />
                                                )}
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                                                    Sign in with Google
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </Card>

                                <BackupInfoCard info={backupInfo} />

                                <HowItWorksCard />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Card>
                                    <SectionLabel>Backup</SectionLabel>
                                    <Text style={{ fontSize: 12, color: '#8a93a6', lineHeight: 18, marginBottom: 14 }}>
                                        Runs automatically every hour. Tap below to back up right now.
                                    </Text>
                                    <PrimaryButton
                                        label="Backup now"
                                        icon="cloud-upload-outline"
                                        onPress={backup}
                                        disabled={!user || syncStatus === 'syncing'}
                                        loading={syncStatus === 'syncing' && syncMessage.includes('Upload')}
                                        variant="filled"
                                    />
                                </Card>

                                <Card>
                                    <SectionLabel>Restore</SectionLabel>
                                    <Text style={{ fontSize: 12, color: '#8a93a6', lineHeight: 18, marginBottom: 12 }}>
                                        Downloads your latest backup and restores secrets, contacts, and encryption key.
                                        Use this when setting up a new device.
                                    </Text>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            backgroundColor: 'rgba(220,38,38,0.06)',
                                            borderRadius: 10,
                                            padding: 12,
                                            marginBottom: 14,
                                            borderWidth: 0.5,
                                            borderColor: 'rgba(220,38,38,0.18)',
                                        }}
                                    >
                                        <Ionicons name="warning-outline" size={15} color="#dc2626" style={{ marginTop: 1 }} />
                                        <Text style={{ flex: 1, fontSize: 12, color: '#dc2626', lineHeight: 18 }}>
                                            This will overwrite your current local data. Ensure you have a recent backup first.
                                        </Text>
                                    </View>
                                    <PrimaryButton
                                        label="Restore from Drive"
                                        icon="cloud-download-outline"
                                        onPress={restore}
                                        disabled={!user || syncStatus === 'syncing'}
                                        loading={syncStatus === 'syncing' && syncMessage.includes('Restore')}
                                        variant="outline"
                                    />
                                </Card>

                                {__DEV__ && (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            const { deleteAllBackupFiles } = await import(
                                                '../utils/GoogleDriveSync'
                                            );

                                            await deleteAllBackupFiles();

                                            Alert.alert(
                                                'Done',
                                                'All backup files deleted.'
                                            );
                                        }}
                                        style={{
                                            alignItems: 'center',
                                            paddingVertical: 10,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: '#dc2626',
                                                opacity: 0.6,
                                            }}
                                        >
                                            [DEV] Delete all backups
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ) :
                        (
                            <>
                                <Card>
                                    <SectionLabel>Google account</SectionLabel>
                                    {user ? (
                                        <View style={{ gap: 14 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <View
                                                    style={{
                                                        width: 42,
                                                        height: 42,
                                                        borderRadius: 21,
                                                        backgroundColor: '#4285F4',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
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
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        backgroundColor: 'rgba(22,163,74,0.10)',
                                                        borderRadius: 20,
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 4,
                                                    }}
                                                >
                                                    <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                                                    <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '600' }}>Connected</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                onPress={logout}
                                                activeOpacity={0.75}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 7,
                                                    borderRadius: 12,
                                                    paddingVertical: 11,
                                                    backgroundColor: 'rgba(220,38,38,0.06)',
                                                    borderWidth: 0.5,
                                                    borderColor: 'rgba(220,38,38,0.18)',
                                                }}
                                            >
                                                <Ionicons name="log-out-outline" size={15} color="#dc2626" />
                                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#dc2626' }}>
                                                    Disconnect Drive
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ gap: 14 }}>
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
                                                    borderRadius: 12,
                                                    paddingVertical: 13,
                                                    backgroundColor: '#4285F4',
                                                    opacity: syncStatus === 'syncing' ? 0.6 : 1,
                                                }}
                                            >
                                                {syncStatus === 'syncing' && !user ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Ionicons name="logo-google" size={17} color="#fff" />
                                                )}
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                                                    Sign in with Google
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </Card>

                                <BackupInfoCard info={backupInfo} />

                                <Card>
                                    <SectionLabel>Backup</SectionLabel>
                                    <Text style={{ fontSize: 12, color: '#8a93a6', lineHeight: 18, marginBottom: 14 }}>
                                        Runs automatically every hour. Tap below to back up right now.
                                    </Text>
                                    <PrimaryButton
                                        label="Backup now"
                                        icon="cloud-upload-outline"
                                        onPress={backup}
                                        disabled={!user || syncStatus === 'syncing'}
                                        loading={syncStatus === 'syncing' && syncMessage.includes('Upload')}
                                        variant="filled"
                                    />
                                </Card>

                                <Card>
                                    <SectionLabel>Restore</SectionLabel>
                                    <Text style={{ fontSize: 12, color: '#8a93a6', lineHeight: 18, marginBottom: 12 }}>
                                        Downloads your latest backup and restores secrets, contacts, and encryption key.
                                        Use this when setting up a new device.
                                    </Text>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            backgroundColor: 'rgba(220,38,38,0.06)',
                                            borderRadius: 10,
                                            padding: 12,
                                            marginBottom: 14,
                                            borderWidth: 0.5,
                                            borderColor: 'rgba(220,38,38,0.18)',
                                        }}
                                    >
                                        <Ionicons name="warning-outline" size={15} color="#dc2626" style={{ marginTop: 1 }} />
                                        <Text style={{ flex: 1, fontSize: 12, color: '#dc2626', lineHeight: 18 }}>
                                            This will overwrite your current local data. Ensure you have a recent backup first.
                                        </Text>
                                    </View>
                                    <PrimaryButton
                                        label="Restore from Drive"
                                        icon="cloud-download-outline"
                                        onPress={restore}
                                        disabled={!user || syncStatus === 'syncing'}
                                        loading={syncStatus === 'syncing' && syncMessage.includes('Restore')}
                                        variant="outline"
                                    />
                                </Card>

                                <HowItWorksCard />

                                {__DEV__ && (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            const { deleteAllBackupFiles } = await import('../utils/GoogleDriveSync');
                                            await deleteAllBackupFiles();
                                            Alert.alert('Done', 'All backup files deleted.');
                                        }}
                                        style={{
                                            alignItems: 'center',
                                            paddingVertical: 10,
                                            marginTop: 4,
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, color: '#dc2626', opacity: 0.6 }}>
                                            [DEV] Delete all backups
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )
                }

            </ScrollView>
        </View>
    );
}