import { authenticateWithBiometrics } from '@/utils/biometric';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useAuthApi } from '../api/Auth/hook';
import { useSecretsApi } from '../api/Secrets/hook';
import { Secret } from '../api/Secrets/types';
import { useUserStore } from '../store/UserStore';
import { Colors } from '../utils/colors';
import { moderateScale } from '../utils/Responsive';


const SecretItem = ({ item, onDelete, onEdit, onView, }: { item: Secret; onDelete: (id: string) => void; onEdit: (item: Secret) => void; onView: (item: Secret) => void; }) => (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onView(item)} className="flex-row items-center bg-[#dce1ec] dark:bg-zinc-900 rounded-[18px] px-4 py-3.5 mb-2.5">
        <View className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 items-center justify-center mr-3">
            <Ionicons name="key-outline" size={moderateScale(18)} color="#4a6fa5" />
        </View>

        <View className="flex-1">
            <Text className="text-[15px] font-medium text-black dark:text-white" numberOfLines={1}>
                {item.name}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
                {item.description}
            </Text>
        </View>

        <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8} className="w-8 h-8 rounded-[10px] bg-red-100 dark:bg-red-950 items-center justify-center">
            <Ionicons name="trash-bin" size={moderateScale(15)} color={Colors.error} />
        </TouchableOpacity>
    </TouchableOpacity>
);


const FloatingMenu = ({ onProfile, onLogout, }: { onProfile: () => void; onLogout: () => void; }) => {
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
            {
                translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                }),
            },
            {
                scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                }),
            },
        ],
    };

    return (
        <View style={dropdownStyles.wrapper}>
            <TouchableOpacity onPress={toggle} activeOpacity={0.8} className="w-11 h-11 rounded-full bg-[#dce1ec] dark:bg-zinc-900 items-center justify-center">
                <Ionicons name="menu" size={moderateScale(22)} color="#4a6fa5" />
            </TouchableOpacity>

            {open && (
                <>
                    <TouchableWithoutFeedback onPress={close}>
                        <View style={StyleSheet.absoluteFillObject} />
                    </TouchableWithoutFeedback>

                    <Animated.View style={[dropdownStyles.menu, animatedStyle]} className="bg-[#6c6c6c] dark:bg-[]#1a1a1a">
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
    wrapper: {
        position: 'relative',
        zIndex: 999,
    },
    menu: {
        position: 'absolute',
        top: moderateScale(52),
        left: 0,
        minWidth: 130,
        borderRadius: moderateScale(14),
        // backgroundColor: '#dce1ec',
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


const ConfirmationModal = ({ visible, title, subTitle, confirmLabel = 'Confirm', onConfirm, onCancel, }: { visible: boolean; title: string; subTitle: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; }) => (
    <Modal transparent visible={visible} animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center">
            <View className="w-[82%] bg-[#dce1ec] dark:bg-zinc-900 rounded-[20px] p-6">
                <Text className="text-lg font-bold text-black dark:text-white">{title}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-5">{subTitle}</Text>
                <View className="flex-row gap-3 mt-5">
                    <TouchableOpacity onPress={onCancel} activeOpacity={0.75} className="flex-1 items-center py-3 rounded-xl bg-black/5 dark:bg-white/5">
                        <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onConfirm} activeOpacity={0.75} className="flex-1 items-center py-3 rounded-xl bg-red-600">
                        <Text className="text-sm font-medium text-white">{confirmLabel}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

export default function DashboardScreen() {
    const user = useUserStore((s) => s.user);
    const { logout } = useAuthApi();
    const { secrets, loading, getList, deleteSecret } = useSecretsApi();

    const [searchText, setSearchText] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const deleteIdRef = useRef<string>('');

    const router = useRouter();

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

    return (
        <View className="flex-1 bg-[#e8ecf4] dark:bg-black">
            <View className="flex-row items-center justify-between px-5 py-3.5 bg-[#e8ecf4] dark:bg-black" style={{ zIndex: 999 }}>
                <FloatingMenu onProfile={() => router.push('/(profile)' as any)} onLogout={() => setShowLogoutModal(true)} />
                <Text className="flex-1 text-center text-[15px] font-medium text-black dark:text-white mx-3" numberOfLines={1}>
                    {user?.email ?? 'Dashboard'}
                </Text>
                <TouchableOpacity onPress={() => router.push('/(create)' as any)} activeOpacity={0.8} className="w-11 h-11 rounded-full bg-[#dce1ec] dark:bg-zinc-900 items-center justify-center">
                    <Ionicons name="add" size={moderateScale(22)} color="#4a6fa5" />
                </TouchableOpacity>
            </View>

            <View className="flex-1 px-4 pt-1">
                <View className="flex-row items-center gap-2.5 bg-[#dce1ec] dark:bg-zinc-900 rounded-2xl px-3.5 py-2.5 mb-4">
                    <Ionicons name="search" size={moderateScale(18)} color="#4a6fa5" />
                    <TextInput
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholder="Search secrets..."
                        placeholderTextColor="#8a93a6"
                        className="flex-1 text-sm text-black dark:text-white p-0"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={moderateScale(16)} color="#8a93a6" />
                        </TouchableOpacity>
                    )}
                </View>

                {displayedSecrets.length > 0 && (
                    <Text className="text-[11px] font-medium text-gray-400 tracking-widest mb-2.5 uppercase">
                        Your secrets · {displayedSecrets.length}
                    </Text>
                )}

                {displayedSecrets.length === 0 ? (
                    <Text className="text-sm text-gray-400 text-center mt-10">
                        {loading ? 'Loading...' : 'No secrets found'}
                    </Text>
                ) : (
                    displayedSecrets.map((item) => (
                        <SecretItem key={item.id} item={item} onDelete={onDeletePress} onEdit={onEditPress} onView={onViewPress} />
                    ))
                )}
            </View>

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
    );
}