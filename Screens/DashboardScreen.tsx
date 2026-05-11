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
import { moderateScale } from '../utils/Responsive';

const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1100;

const SecretItem = ({ item, onDelete, onEdit, onView, isTablet, }: { item: Secret; onDelete: (id: string) => void; onEdit: (item: Secret) => void; onView: (item: Secret) => void; isTablet: boolean; }) => (
    <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onView(item)}
        style={{
            flexDirection: 'row',
            borderRadius: isTablet ? 20 : 18,
            paddingHorizontal: isTablet ? 20 : 16,
            paddingVertical: isTablet ? 16 : 14,
            marginBottom: isTablet ? 0 : 10,
            shadowColor: '#000',
            shadowOpacity: isTablet ? 0.05 : 0,
            shadowRadius: isTablet ? 12 : 0,
            shadowOffset: { width: 0, height: 4 },
            elevation: isTablet ? 2 : 0,
        }}
        className="bg-[#dce1ec] dark:bg-zinc-900"
    >
        <View
            style={{
                width: isTablet ? 44 : 40,
                height: isTablet ? 44 : 40,
                borderRadius: isTablet ? 14 : 12,
                backgroundColor: 'rgba(74,111,165,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: isTablet ? 14 : 12,
            }}
        >
            <Ionicons name="key-outline" size={isTablet ? 20 : 18} color="#4a6fa5" />
        </View>

        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: isTablet ? 15 : 15, fontWeight: '500' }} className="text-black dark:text-white" numberOfLines={1}>
                {item.name}
            </Text>
            <Text style={{ fontSize: 12, marginTop: 2 }} className="text-gray-500 dark:text-gray-400" numberOfLines={1}>
                {item.description}
            </Text>
        </View>

        <TouchableOpacity
            onPress={() => onDelete(item.id)}
            hitSlop={8}
            style={{
                width: isTablet ? 34 : 32,
                height: isTablet ? 34 : 32,
                borderRadius: isTablet ? 10 : 10,
                backgroundColor: 'rgba(239,68,68,0.10)',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Ionicons name="trash-bin" size={isTablet ? 15 : 15} color={Colors.error} />
        </TouchableOpacity>
    </TouchableOpacity>
);

const FloatingMenu = ({
    onProfile,
    onLogout,
}: {
    onProfile: () => void;
    onLogout: () => void;
}) => {
    const [open, setOpen] = useState(false);
    const anim = useRef(new Animated.Value(0)).current;

    const toggle = () => {
        if (open) {
            Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() =>
                setOpen(false),
            );
        } else {
            setOpen(true);
            Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        }
    };

    const close = () => {
        Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() =>
            setOpen(false),
        );
    };

    const animatedStyle = {
        opacity: anim,
        transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
        ],
    };

    return (
        <View style={dropdownStyles.wrapper}>
            <TouchableOpacity
                onPress={toggle}
                activeOpacity={0.8}
                className="w-11 h-11 rounded-full bg-[#dce1ec] dark:bg-zinc-900 items-center justify-center"
            >
                <Ionicons name="menu" size={24} color="#4a6fa5" />
            </TouchableOpacity>

            {open && (
                <>
                    <TouchableWithoutFeedback onPress={close}>
                        <View style={StyleSheet.absoluteFillObject} />
                    </TouchableWithoutFeedback>

                    <Animated.View style={[dropdownStyles.menu, animatedStyle]} className="bg-[#6c6c6c] dark:bg-[#1a1a1a]">
                        <TouchableOpacity onPress={() => { close(); onLogout(); }} activeOpacity={0.75} className="flex-row items-center gap-2.5 px-3.5 py-3">
                            <View className="w-7 h-7 rounded-lg bg-red-200 dark:bg-red-950 items-center justify-center">
                                <Ionicons name="power" size={moderateScale(14)} color={Colors.error} />
                            </View>
                            <Text className="text-sm font-medium text-white">Logout</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </>
            )}
        </View>
    );
};

const dropdownStyles = StyleSheet.create({
    wrapper: { position: 'relative', zIndex: 999 },
    menu: {
        position: 'absolute',
        top: moderateScale(52),
        left: 0,
        minWidth: 130,
        borderRadius: moderateScale(14),
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.06)',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        overflow: 'hidden',
    },
});

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
            <View
                style={{
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: 24,
                    padding: 24,
                }}
                className="bg-[#dce1ec] dark:bg-zinc-900"
            >
                <View
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: 'rgba(239,68,68,0.10)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                    }}
                >
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
                        style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14 }}
                        className="bg-black/5 dark:bg-white/5"
                    >
                        <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onConfirm}
                        activeOpacity={0.75}
                        style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: '#dc2626' }}
                    >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{confirmLabel}</Text>
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
            style={{
                width: 260,
                backgroundColor: '#dce1ec',
                borderRightWidth: 1,
                borderRightColor: 'rgba(74,111,165,0.08)',
                paddingVertical: 32,
                paddingHorizontal: 20,
                gap: 28,
            }}
            className="dark:bg-zinc-900"
        >
            <View style={{ gap: 6 }}>
                <View
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        backgroundColor: '#4a6fa5',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#4a6fa5',
                        shadowOpacity: 0.35,
                        shadowRadius: 14,
                        shadowOffset: { width: 0, height: 6 },
                        marginBottom: 4,
                    }}
                >
                    <Ionicons name="shield-checkmark-outline" size={26} color="#fff" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e' }} className="dark:text-white">
                    iSmart Manager
                </Text>
                <Text style={{ fontSize: 12, color: '#8a93a6', lineHeight: 18 }}>
                    Encrypted secrets
                </Text>
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: 'rgba(74,111,165,0.08)',
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(74,111,165,0.12)',
                }}
            >
                <View
                    style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#4a6fa5', alignItems: 'center', justifyContent: 'center', }}>
                    <Ionicons name="person-outline" size={16} color="#fff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', flex: 1 }} className="text-black dark:text-white" numberOfLines={1}>
                    {email ?? 'User'}
                </Text>
            </View>

            <View
                style={{
                    backgroundColor: 'rgba(74,111,165,0.06)',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    gap: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(74,111,165,0.10)',
                }}
            >
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#4a6fa5' }}>{secretCount}</Text>
                <Text style={{ fontSize: 12, color: '#8a93a6' }}>
                    {secretCount === 1 ? 'secret stored' : 'secrets stored'}
                </Text>
            </View>

            <TouchableOpacity
                onPress={onCreateNew}
                activeOpacity={0.85}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#4a6fa5',
                    borderRadius: 16,
                    paddingVertical: 14,
                    shadowColor: '#4a6fa5',
                    shadowOpacity: 0.30,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 5 },
                }}
            >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>New Secret</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
                onPress={onLogout}
                activeOpacity={0.75}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.12)',
                }}
            >
                <Ionicons name="power" size={16} color={Colors.error} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.error }}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function DashboardScreen() {
    const user = useUserStore((s) => s.user);
    const { logout } = useAuthApi();
    const { secrets, loading, getList, deleteSecret } = useSecretsApi();

    const [searchText, setSearchText] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const deleteIdRef = useRef<string>('');

    const router = useRouter();
    const { width } = useWindowDimensions();

    const isTablet = width >= TABLET_WIDTH;
    const isDesktop = width >= DESKTOP_WIDTH;

    const numColumns = isDesktop ? 2 : isTablet ? 2 : 1;

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
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    borderRadius: isTablet ? 18 : 16,
                    paddingHorizontal: isTablet ? 18 : 14,
                    paddingVertical: isTablet ? 14 : 10,
                    marginBottom: isTablet ? 24 : 16,
                    shadowColor: '#000',
                    shadowOpacity: isTablet ? 0.05 : 0,
                    shadowRadius: isTablet ? 10 : 0,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: isTablet ? 2 : 0,
                }}
                className="bg-[#dce1ec] dark:bg-zinc-900"
            >
                <Ionicons name="search" size={isTablet ? 20 : 18} color="#4a6fa5" />
                <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search secrets…"
                    placeholderTextColor="#8a93a6"
                    style={{ flex: 1, fontSize: isTablet ? 15 : 14, color: '#000' }}
                    className="dark:text-white p-0 focus:outline-none"
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color="#8a93a6" />
                    </TouchableOpacity>
                )}
            </View>

            {displayedSecrets.length > 0 && (
                <Text
                    style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: '#8a93a6',
                        textTransform: 'uppercase',
                        letterSpacing: 1.4,
                        marginBottom: isTablet ? 16 : 10,
                    }}
                >
                    {searchText.trim() ? 'Results' : 'Your secrets'} · {displayedSecrets.length}
                </Text>
            )}

            {displayedSecrets.length === 0 ? (
                <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
                    <View
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 22,
                            backgroundColor: 'rgba(74,111,165,0.10)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name={loading ? 'hourglass-outline' : 'key-outline'} size={28} color="#4a6fa5" />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '600' }} className="text-black dark:text-white">
                        {loading ? 'Loading…' : searchText.trim() ? 'No results' : 'No secrets yet'}
                    </Text>
                    {!loading && !searchText.trim() && (
                        <Text style={{ fontSize: 13, color: '#8a93a6', textAlign: 'center', lineHeight: 20, maxWidth: 240 }}>
                            Tap the + button to store your first encrypted secret.
                        </Text>
                    )}
                </View>
            ) : (
                isTablet ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 12,
                        }}
                    >
                        {displayedSecrets.map((item) => (
                            <View
                                key={item.id}
                                style={{
                                    width: isDesktop
                                        ? 'calc(50% - 6px)' as any
                                        : '100%',
                                }}
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
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <Sidebar
                            email={user?.email}
                            secretCount={displayedSecrets.length}
                            onLogout={() => setShowLogoutModal(true)}
                            onCreateNew={handleCreateNew}
                        />
                        <View style={{ flex: 1 }}>
                            <ContentArea />
                        </View>
                    </View>
                ) : (
                    <>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: isTablet ? 32 : 20,
                                paddingVertical: isTablet ? 18 : 14,
                                borderBottomWidth: isTablet ? 1 : 0,
                                borderBottomColor: 'rgba(74,111,165,0.10)',
                                zIndex: 999,
                            }}
                        >
                            <FloatingMenu
                                onProfile={() => router.push('/(profile)' as any)}
                                onLogout={() => setShowLogoutModal(true)}
                            />

                            <View style={{ alignItems: 'center', gap: 2 }}>
                                <Text
                                    style={{ fontSize: isTablet ? 16 : 15, fontWeight: '600' }}
                                    className="text-black dark:text-white"
                                    numberOfLines={1}
                                >
                                    {user?.email ?? 'Dashboard'}
                                </Text>
                                {isTablet && (
                                    <Text style={{ fontSize: 11, color: '#8a93a6' }}>
                                        {secrets.length} {secrets.length === 1 ? 'secret' : 'secrets'} stored
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={handleCreateNew}
                                activeOpacity={0.8}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: '#4a6fa5',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: '#4a6fa5',
                                    shadowOpacity: isTablet ? 0.35 : 0,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                    elevation: isTablet ? 4 : 0,
                                }}
                            >
                                <Ionicons name="add" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ContentArea />
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