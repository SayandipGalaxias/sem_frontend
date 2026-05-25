import { authenticateWithBiometrics } from '@/utils/biometric';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions
} from 'react-native';
import { useAuthApi } from '../api/Auth/hook';
import { useSecretsApi } from '../api/Secrets/hook';
import { Secret } from '../api/Secrets/types';
import { useUserStore } from '../store/UserStore';
import { Colors } from '../utils/colors';

const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1100;

const SecretItem = ({
    item,
    onDelete,
    onEdit,
    onView,
    isTablet,
}: {
    item: Secret;
    onDelete: (id: string) => void;
    onEdit: (item: Secret) => void;
    onView: (item: Secret) => void;
    isTablet: boolean;
}) => (
    <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onView(item)}
        className={`flex-row bg-[#dce1ec] dark:bg-zinc-900 ${isTablet ? 'rounded-[20px] px-5 py-4 mb-0' : 'rounded-[18px] px-4 py-3.5 mb-2.5'}`}
        style={isTablet ? {
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
        } : undefined}
    >
        <View
            className={`items-center justify-center bg-[rgba(74,111,165,0.12)] ${isTablet ? 'w-11 h-11 rounded-[14px] mr-3.5' : 'w-10 h-10 rounded-xl mr-3'}`}
        >
            <Ionicons name="key-outline" size={isTablet ? 20 : 18} color="#4a6fa5" />
        </View>

        <View className="flex-1">
            <Text
                className={`font-medium text-black dark:text-white ${isTablet ? 'text-[15px]' : 'text-[15px]'}`}
                numberOfLines={1}
            >
                {item.name}
            </Text>
            <Text className="text-xs mt-0.5 text-gray-500 dark:text-gray-400" numberOfLines={1}>
                {item.description}
            </Text>
        </View>

        <TouchableOpacity
            onPress={() => onDelete(item.id)}
            hitSlop={8}
            className={`items-center justify-center bg-red-500/10 ${isTablet ? 'w-[34px] h-[34px] rounded-[10px]' : 'w-8 h-8 rounded-[10px]'}`}
        >
            <Ionicons name="trash-bin" size={15} color={Colors.error} />
        </TouchableOpacity>
    </TouchableOpacity>
);


function getInitials(email?: string): string {
    if (!email) return 'U';
    const local = email.split('@')[0];
    const parts = local.split(/[._\-]/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
}

const Drawer = ({
    email,
    visible,
    onClose,
    onLogout,
    onContacts,
    onWhatsAppBackup,
    onPricing,
    onConnectServer,
    onBackup,
}: {
    email?: string;
    visible: boolean;
    onClose: () => void;
    onLogout: () => void;
    onContacts: () => void;
    onWhatsAppBackup: () => void;
    onPricing: () => void;
    onConnectServer: () => void;
    onBackup: () => void;
}) => {
    const translateX = useRef(new Animated.Value(-320)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const [rendered, setRendered] = useState(false);

    React.useEffect(() => {
        if (visible) {
            setRendered(true);
            Animated.parallel([
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
                Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateX, { toValue: -320, duration: 220, useNativeDriver: true }),
                Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start(() => setRendered(false));
        }
    }, [visible]);

    if (!rendered) return null;

    const initials = getInitials(email);

    const menuItems = [
        {
            icon: 'people-outline' as const,
            label: 'Contacts',
            onPress: onContacts,
            color: '#4a6fa5',
            bg: 'bg-[rgba(74,111,165,0.10)]',
        },
        {
            icon: 'diamond-outline' as const,
            label: 'Pricing',
            onPress: onPricing,
            color: '#f59e0b',
            bg: 'bg-amber-500/10',
        },
        {
            icon: 'server-outline' as const,
            label: 'Connect Server',
            onPress: onConnectServer,
            color: '#e67e22',
            bg: 'bg-orange-500/10',
        },
        {
            icon: 'logo-whatsapp' as const,
            label: 'WhatsApp Backup',
            onPress: onWhatsAppBackup,
            color: '#25D366',
            bg: 'bg-[rgba(37,211,102,0.10)]',
        },
        {
            icon: 'sync-outline' as const,
            label: 'Backup',
            onPress: onBackup,
            color: '#16a085',
            bg: 'bg-[rgba(39,211,245,0.10)]',
        },
    ];

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none" className='z-50'>
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View
                    style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropOpacity }]}
                />
            </TouchableWithoutFeedback>

            <Animated.View
                className="absolute top-0 left-0 bottom-0 w-[290px] pt-14 pb-8 bg-[#dce1ec] dark:bg-zinc-900"
                style={{
                    transform: [{ translateX }],
                    shadowColor: '#000',
                    shadowOpacity: 0.18,
                    shadowRadius: 24,
                    shadowOffset: { width: 6, height: 0 },
                    elevation: 12,
                }}
            >
                <View className="px-6 pb-6 items-start gap-2">
                    <View
                        className="w-14 h-14 rounded-[18px] bg-[#4a6fa5] items-center justify-center mb-1"
                        style={{
                            shadowColor: '#4a6fa5',
                            shadowOpacity: 0.35,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 5 },
                        }}
                    >
                        <Text className="text-xl font-bold text-white tracking-wide">{initials}</Text>
                    </View>
                    <Text className="text-sm font-semibold text-[#1a1a2e] dark:text-white" numberOfLines={1}>
                        {email ?? 'User'}
                    </Text>
                    <Text className="text-[11px] text-[#8a93a6] tracking-[0.2px]">Encrypted Secrets Vault</Text>
                </View>

                <View className="h-px bg-[rgba(74,111,165,0.10)] mx-5 my-2" />

                <View className="px-3 pt-2 gap-1">
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.label}
                            onPress={() => { onClose(); item.onPress(); }}
                            activeOpacity={0.75}
                            className="flex-row items-center px-3 py-[13px] rounded-[14px] gap-3"
                        >
                            <View className={`w-9 h-9 rounded-[11px] items-center justify-center ${item.bg}`}>
                                <Ionicons name={item.icon} size={18} color={item.color} />
                            </View>
                            <Text className="flex-1 text-sm font-medium text-[#1a1a2e] dark:text-white">{item.label}</Text>
                            <Ionicons name="chevron-forward" size={14} color="#8a93a6" />
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="flex-1" />

                <View className="h-px bg-[rgba(74,111,165,0.10)] mx-5 my-2" />

                <TouchableOpacity
                    onPress={() => { onClose(); onLogout(); }}
                    activeOpacity={0.75}
                    className="flex-row items-center mx-3 mt-2 px-3 py-[13px] rounded-[14px] bg-red-500/[0.07] gap-3"
                >
                    <View className="w-9 h-9 rounded-[11px] bg-red-500/10 items-center justify-center">
                        <Ionicons name="power" size={17} color={Colors.error} />
                    </View>
                    <Text className="text-sm font-semibold" style={{ color: Colors.error }}>Logout</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};


const ConfirmationModal = ({
    visible,
    title,
    subTitle,
    confirmLabel = 'Confirm',
    onConfirm,
    onCancel,
}: {
    visible: boolean;
    title: string;
    subTitle: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) => (
    <Modal transparent visible={visible} animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
            <View className="w-full max-w-[400px] rounded-3xl p-6 bg-[#dce1ec] dark:bg-zinc-900">
                <View className="w-12 h-12 rounded-2xl bg-red-500/10 items-center justify-center mb-4">
                    <Ionicons
                        name={confirmLabel === 'Logout' ? 'power' : 'trash-bin'}
                        size={22}
                        color={Colors.error}
                    />
                </View>
                <Text className="text-lg font-bold text-black dark:text-white">{title}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-5">{subTitle}</Text>
                <View className="flex-row gap-3 mt-6">
                    <TouchableOpacity
                        onPress={onCancel}
                        activeOpacity={0.75}
                        className="flex-1 items-center py-[13px] rounded-[14px] bg-black/5 dark:bg-white/5"
                    >
                        <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onConfirm}
                        activeOpacity={0.75}
                        className="flex-1 items-center py-[13px] rounded-[14px] bg-red-600"
                    >
                        <Text className="text-sm font-semibold text-white">{confirmLabel}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);


function Sidebar({
    email,
    secretCount,
    onLogout,
    onCreateNew,
}: {
    email?: string;
    secretCount: number;
    onLogout: () => void;
    onCreateNew: () => void;
}) {
    return (
        <View
            className="w-[260px] bg-[#dce1ec] dark:bg-zinc-900 border-r border-[rgba(74,111,165,0.08)] py-8 px-5 gap-7"
        >
            <View className="gap-1.5">
                <View
                    className="w-[52px] h-[52px] rounded-[18px] bg-[#4a6fa5] items-center justify-center mb-1"
                    style={{
                        shadowColor: '#4a6fa5',
                        shadowOpacity: 0.35,
                        shadowRadius: 14,
                        shadowOffset: { width: 0, height: 6 },
                    }}
                >
                    <Ionicons name="shield-checkmark-outline" size={26} color="#fff" />
                </View>
                <Text className="text-lg font-bold text-[#1a1a2e] dark:text-white">iSmart Manager</Text>
                <Text className="text-xs text-[#8a93a6] leading-[18px]">Encrypted secrets</Text>
            </View>

            <View className="flex-row items-center gap-2.5 bg-[rgba(74,111,165,0.08)] rounded-[14px] px-3.5 py-3 border border-[rgba(74,111,165,0.12)]">
                <View className="w-[34px] h-[34px] rounded-[10px] bg-[#4a6fa5] items-center justify-center">
                    <Ionicons name="person-outline" size={16} color="#fff" />
                </View>
                <Text className="text-[13px] font-medium flex-1 text-black dark:text-white" numberOfLines={1}>
                    {email ?? 'User'}
                </Text>
            </View>

            <View className="bg-[rgba(74,111,165,0.06)] rounded-[14px] px-4 py-3.5 gap-1 border border-[rgba(74,111,165,0.10)]">
                <Text className="text-[28px] font-bold text-[#4a6fa5]">{secretCount}</Text>
                <Text className="text-xs text-[#8a93a6]">
                    {secretCount === 1 ? 'secret stored' : 'secrets stored'}
                </Text>
            </View>

            <TouchableOpacity
                onPress={onCreateNew}
                activeOpacity={0.85}
                className="flex-row items-center justify-center gap-2 bg-[#4a6fa5] rounded-2xl py-3.5"
                style={{
                    shadowColor: '#4a6fa5',
                    shadowOpacity: 0.30,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 5 },
                }}
            >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text className="text-sm font-semibold text-white">New Secret</Text>
            </TouchableOpacity>

            <View className="flex-1" />

            <TouchableOpacity
                onPress={onLogout}
                activeOpacity={0.75}
                className="flex-row items-center gap-2.5 px-3.5 py-3 rounded-[14px] bg-red-500/[0.08] border border-red-500/[0.12]"
            >
                <Ionicons name="power" size={16} color={Colors.error} />
                <Text className="text-sm font-medium text-red-600">Logout</Text>
            </TouchableOpacity>
        </View>
    );
}


export default function DashboardScreen() {
    const user = useUserStore((s) => s.user);
    const { logout } = useAuthApi();
    const { secrets, loading, getList, deleteSecret } = useSecretsApi();

    const [searchText, setSearchText] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const deleteIdRef = useRef<string>('');

    const router = useRouter();
    const { width } = useWindowDimensions();

    const isTablet = width >= TABLET_WIDTH;
    const isDesktop = width >= DESKTOP_WIDTH;

    useFocusEffect(
        React.useCallback(() => {
            getList();
        }, [getList]),
    );

    const displayedSecrets = searchText.trim()
        ? secrets.filter((s) => s.name?.toLowerCase().includes(searchText.toLowerCase()))
        : secrets;

    const onDeletePress = (id: string) => {
        deleteIdRef.current = id;
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        await deleteSecret(deleteIdRef.current);
        setShowDeleteModal(false);
    };

    const onEditPress = (item: Secret) => {
        router.push({
            pathname: '/(create)' as any,
            params: { id: item.id, name: item.name, secret: item.secret, description: item.description },
        });
    };

    const onViewPress = async (item: Secret) => {
        const authenticated = await authenticateWithBiometrics('Authenticate to view secret');
        if (!authenticated) return;
        router.push({
            pathname: '/(view)' as any,
            params: { id: item.id, name: item.name, secret: item.secret, description: item.description },
        });
    };

    const handleCreateNew = () => router.push('/(create)' as any);

    const ContentArea = () => (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
                paddingHorizontal: isDesktop ? 40 : isTablet ? 32 : 16,
                paddingTop: isTablet ? 32 : 12,
                paddingBottom: 40,
                flexGrow: 1,
            }}
        >
            <View
                className={`flex-row items-center gap-2.5 bg-[#dce1ec] dark:bg-zinc-900 ${isTablet ? 'rounded-[18px] px-[18px] py-3.5 mb-6' : 'rounded-2xl px-3.5 py-2.5 mb-4'}`}
                style={isTablet ? {
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 2,
                } : undefined}
            >
                <Ionicons name="search" size={isTablet ? 20 : 18} color="#4a6fa5" />
                <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search secrets…"
                    placeholderTextColor="#8a93a6"
                    className={`flex-1 text-black dark:text-white p-0 focus:outline-none ${isTablet ? 'text-[15px]' : 'text-sm'}`}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color="#8a93a6" />
                    </TouchableOpacity>
                )}
            </View>

            {displayedSecrets.length > 0 && (
                <Text
                    className={`text-[11px] font-semibold text-[#8a93a6] uppercase tracking-[1.4px] ${isTablet ? 'mb-4' : 'mb-2.5'}`}
                >
                    {searchText.trim() ? 'Results' : 'Your secrets'} · {displayedSecrets.length}
                </Text>
            )}

            {displayedSecrets.length === 0 ? (
                <View className="items-center mt-[60px] gap-3">
                    <View className="w-16 h-16 rounded-[22px] bg-[rgba(74,111,165,0.10)] items-center justify-center">
                        <Ionicons name={loading ? 'hourglass-outline' : 'key-outline'} size={28} color="#4a6fa5" />
                    </View>
                    <Text className="text-[15px] font-semibold text-black dark:text-white">
                        {loading ? 'Loading…' : searchText.trim() ? 'No results' : 'No secrets yet'}
                    </Text>
                    {!loading && !searchText.trim() && (
                        <Text className="text-[13px] text-[#8a93a6] text-center leading-5 max-w-[240px]">
                            Tap the + button to store your first encrypted secret.
                        </Text>
                    )}
                </View>
            ) : (
                isTablet ? (
                    <View className="flex-row flex-wrap gap-3">
                        {displayedSecrets.map((item) => (
                            <View
                                key={item.id}
                                style={{ width: isDesktop ? 'calc(50% - 6px)' as any : '100%' }}
                            >
                                <SecretItem
                                    item={item}
                                    onDelete={onDeletePress}
                                    onEdit={onEditPress}
                                    onView={onViewPress}
                                    isTablet={isTablet}
                                />
                            </View>
                        ))}
                    </View>
                ) : (
                    displayedSecrets.map((item) => (
                        <SecretItem
                            key={item.id}
                            item={item}
                            onDelete={onDeletePress}
                            onEdit={onEditPress}
                            onView={onViewPress}
                            isTablet={false}
                        />
                    ))
                )
            )}
        </ScrollView>
    );

    return (
        <View className="bg-[#e8ecf4] dark:bg-black flex-1">
            <View className="flex-1 bg-[#e8ecf4] dark:bg-black w-full">

                {isDesktop ? (
                    <View className="flex-1 flex-row">
                        <Sidebar
                            email={user?.email}
                            secretCount={displayedSecrets.length}
                            onLogout={() => setShowLogoutModal(true)}
                            onCreateNew={handleCreateNew}
                        />
                        <View className="flex-1">
                            <ContentArea />
                        </View>
                    </View>
                ) : (
                    <>
                        <View
                            className={`flex-row items-center justify-between z-10 ${isTablet ? 'px-8 py-[18px] border-b border-[rgba(74,111,165,0.10)]' : 'px-5 py-3.5'}`}
                        >
                            <TouchableOpacity
                                onPress={() => setShowDrawer(true)}
                                activeOpacity={0.8}
                                className="w-11 h-11 rounded-full bg-[#dce1ec] dark:bg-zinc-900 items-center justify-center"
                            >
                                <Ionicons name="menu" size={24} color="#4a6fa5" />
                            </TouchableOpacity>

                            <View className="items-center gap-0.5">
                                <Text
                                    className={`font-semibold text-black dark:text-white ${isTablet ? 'text-base' : 'text-[15px]'}`}
                                >
                                    iSmart Manager
                                </Text>
                                {isTablet && (
                                    <Text className="text-[11px] text-[#8a93a6]">
                                        {secrets.length} {secrets.length === 1 ? 'secret' : 'secrets'} stored
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={handleCreateNew}
                                activeOpacity={0.8}
                                className="w-11 h-11 rounded-full bg-[#4a6fa5] items-center justify-center"
                                style={isTablet ? {
                                    shadowColor: '#4a6fa5',
                                    shadowOpacity: 0.35,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                    elevation: 4,
                                } : undefined}
                            >
                                <Ionicons name="add" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ContentArea />

                        <Drawer
                            email={user?.email}
                            visible={showDrawer}
                            onClose={() => setShowDrawer(false)}
                            onLogout={() => setShowLogoutModal(true)}
                            onContacts={() => router.push('/(contacts)' as any)}
                            onPricing={() => router.push('/(pricing)' as any)}
                            onConnectServer={() => router.push('/(connect)' as any)}
                            onWhatsAppBackup={() => router.push('/(whatsapp-backup)' as any)}
                            onBackup={() => router.push('/(backup)' as any)}
                        />
                    </>
                )}

                <ConfirmationModal
                    visible={showLogoutModal}
                    title="Logout"
                    subTitle={'Are you sure you want to logout?\n\nYour session will be terminated.'}
                    confirmLabel="Logout"
                    onConfirm={() => { setShowLogoutModal(false); logout(); }}
                    onCancel={() => setShowLogoutModal(false)}
                />

                <ConfirmationModal
                    visible={showDeleteModal}
                    title="Delete Secret"
                    subTitle="Are you sure you want to delete this secret? This action cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
            </View>
        </View>
    );
}